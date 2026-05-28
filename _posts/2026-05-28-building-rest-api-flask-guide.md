---
layout: post
title: "Building a REST API with Flask: Complete Guide"
date: 2026-05-28
categories: [Python, Flask, API]
tags: [python, flask, rest api, web development, backend]
image: /assets/images/flask-rest-api-guide.jpg
---

Flask remains one of the most popular Python frameworks for building REST APIs. Its simplicity and flexibility make it an excellent choice for everything from small microservices to large-scale applications.

This guide walks through building a production-ready REST API with Flask, covering project structure, authentication, validation, error handling, and testing.

## Project Setup

### Directory Structure

```
flask_api/
├── app/
│   ├── __init__.py
│   ├── config.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── user.py
│   ├── routes/
│   │   ├── __init__.py
│   │   └── users.py
│   ├── services/
│   │   ├── __init__.py
│   │   └── user_service.py
│   ├── middleware/
│   │   ├── __init__.py
│   │   └── auth.py
│   └── schemas/
│       ├── __init__.py
│       └── user_schema.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   └── test_users.py
├── migrations/
├── requirements.txt
├── .flaskenv
└── run.py
```

### Dependencies

```txt
# requirements.txt
Flask==3.1.0
Flask-SQLAlchemy==3.1.1
Flask-Marshmallow==0.15.0
marshmallow==3.23.0
flask-jwt-extended==4.7.1
python-dotenv==1.0.1
psycopg2-binary==2.9.10
pytest==8.3.0
pytest-cov==6.0.0
```

## Application Factory Pattern

```python
# app/__init__.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_jwt_extended import JWTManager
from app.config import config_by_name

db = SQLAlchemy()
ma = Marshmallow()
jwt = JWTManager()

def create_app(config_name='development'):
    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])

    # Initialize extensions
    db.init_app(app)
    ma.init_app(app)
    jwt.init_app(app)

    # Register blueprints
    from app.routes.users import users_bp
    app.register_blueprint(users_bp, url_prefix='/api/v1/users')

    # Error handlers
    register_error_handlers(app)

    return app

def register_error_handlers(app):
    @app.errorhandler(404)
    def not_found(e):
        return {'error': 'Resource not found'}, 404

    @app.errorhandler(400)
    def bad_request(e):
        return {'error': str(e)}, 400

    @app.errorhandler(500)
    def internal_error(e):
        return {'error': 'Internal server error'}, 500
```

## Configuration

```python
# app/config.py
import os

class BaseConfig:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key-change-in-production')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour
    JWT_REFRESH_TOKEN_EXPIRES = 86400  # 24 hours
    PAGE_SIZE = 20

class DevelopmentConfig(BaseConfig):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL', 'sqlite:///dev.db'
    )

class TestingConfig(BaseConfig):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///test.db'

class ProductionConfig(BaseConfig):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')

config_by_name = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
}
```

## Database Models

```python
# app/models/user.py
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from app import db

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(
        db.DateTime, default=datetime.utcnow
    )
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
        }
```

## Request Validation with Marshmallow

```python
# app/schemas/user_schema.py
from marshmallow import Schema, fields, validate, post_load

class CreateUserSchema(Schema):
    username = fields.Str(
        required=True,
        validate=[
            validate.Length(min=3, max=80),
            validate.Regexp(
                r'^[a-zA-Z0-9_]+$',
                error='Username must contain only letters, numbers, and underscores'
            )
        ]
    )
    email = fields.Email(required=True)
    password = fields.Str(
        required=True,
        validate=validate.Length(min=8, max=128),
        load_only=True
    )

class UpdateUserSchema(Schema):
    username = fields.Str(
        validate=[
            validate.Length(min=3, max=80),
            validate.Regexp(r'^[a-zA-Z0-9_]+$')
        ]
    )
    email = fields.Email()
    is_active = fields.Bool()

class UserResponseSchema(Schema):
    id = fields.Int()
    username = fields.Str()
    email = fields.Email()
    is_active = fields.Bool()
    created_at = fields.DateTime()

class PaginationSchema(Schema):
    page = fields.Int(missing=1, validate=validate.Range(min=1))
    per_page = fields.Int(
        missing=20,
        validate=validate.Range(min=1, max=100)
    )
```

## Authentication Middleware

```python
# app/middleware/auth.py
from functools import wraps
from flask_jwt_extended import (
    verify_jwt_in_request,
    get_jwt_identity,
    create_access_token,
    create_refresh_token,
)
from app.models.user import User
from flask import jsonify

def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or not user.is_active:
            return jsonify({'error': 'Unauthorized'}), 401
        return fn(*args, **kwargs)
    return wrapper

def generate_tokens(user_id):
    access_token = create_access_token(identity=user_id)
    refresh_token = create_refresh_token(identity=user_id)
    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'Bearer'
    }
```

## API Routes

```python
# app/routes/users.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.schemas.user_schema import (
    CreateUserSchema, UpdateUserSchema,
    UserResponseSchema, PaginationSchema
)
from app.middleware.auth import admin_required, generate_tokens
from marshmallow import ValidationError

users_bp = Blueprint('users', __name__)
create_schema = CreateUserSchema()
update_schema = UpdateUserSchema()
response_schema = UserResponseSchema()
pagination_schema = PaginationSchema()

@users_bp.route('', methods=['POST'])
def create_user():
    try:
        data = create_schema.load(request.get_json())
    except ValidationError as e:
        return jsonify({'errors': e.messages}), 400

    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 409

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 409

    user = User(
        username=data['username'],
        email=data['email']
    )
    user.set_password(data['password'])

    db.session.add(user)
    db.session.commit()

    tokens = generate_tokens(user.id)
    return jsonify({
        'user': response_schema.dump(user),
        **tokens
    }), 201

@users_bp.route('', methods=['GET'])
@jwt_required()
def list_users():
    try:
        params = pagination_schema.load(request.args)
    except ValidationError as e:
        return jsonify({'errors': e.messages}), 400

    page = params['page']
    per_page = params['per_page']

    pagination = User.query.paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'users': response_schema.dump(pagination.items, many=True),
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages,
    })

@users_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify({'user': response_schema.dump(user)})

@users_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    current_user_id = get_jwt_identity()
    if current_user_id != user_id:
        return jsonify({'error': 'Forbidden'}), 403

    user = User.query.get_or_404(user_id)

    try:
        data = update_schema.load(request.get_json(), partial=True)
    except ValidationError as e:
        return jsonify({'errors': e.messages}), 400

    for field, value in data.items():
        setattr(user, field, value)

    db.session.commit()
    return jsonify({'user': response_schema.dump(user)})

@users_bp.route('/<int:user_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return '', 204
```

## Testing

```python
# tests/conftest.py
import pytest
from app import create_app, db as _db

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        _db.create_all()
        yield app
        _db.session.remove()
        _db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def auth_headers(client):
    response = client.post('/api/v1/users', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'securepassword123'
    })
    token = response.json['access_token']
    return {'Authorization': f'Bearer {token}'}

# tests/test_users.py
def test_create_user(client):
    response = client.post('/api/v1/users', json={
        'username': 'newuser',
        'email': 'new@example.com',
        'password': 'securepassword123'
    })
    assert response.status_code == 201
    data = response.json
    assert data['user']['username'] == 'newuser'
    assert 'access_token' in data

def test_create_duplicate_user(client):
    payload = {
        'username': 'dupuser',
        'email': 'dup@example.com',
        'password': 'securepassword123'
    }
    client.post('/api/v1/users', json=payload)
    response = client.post('/api/v1/users', json=payload)
    assert response.status_code == 409

def test_list_users(client, auth_headers):
    response = client.get(
        '/api/v1/users',
        headers=auth_headers
    )
    assert response.status_code == 200
    assert 'users' in response.json
    assert 'total' in response.json

def test_get_user(client, auth_headers):
    response = client.get(
        '/api/v1/users/1',
        headers=auth_headers
    )
    assert response.status_code == 200

def test_unauthorized_access(client):
    response = client.get('/api/v1/users')
    assert response.status_code == 401
```

## Running the Application

```python
# run.py
from app import create_app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
```

```bash
# .flaskenv
FLASK_APP=run.py
FLASK_ENV=development
```

## Best Practices

1. **Use application factory pattern**: Makes testing and configuration management easier
2. **Validate all inputs**: Never trust client data — use Marshmallow schemas
3. **Use pagination**: Never return unbounded result sets
4. **Handle errors gracefully**: Return consistent error responses with appropriate status codes
5. **Write tests first**: Aim for high test coverage on your API endpoints
6. **Use environment variables**: Never hardcode secrets or configuration

This guide covers the essential patterns for building a Flask REST API. From here, you can extend with caching (Redis), rate limiting, CORS configuration, and containerized deployment.
