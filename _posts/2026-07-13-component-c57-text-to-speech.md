---
layout: post
title: "文本转语音 Text to Speech | Web Speech API让浏览器开口说话"
date: 2026-07-13
categories: [component]
tags: [web-component, javascript, web-speech-api, accessibility]
---

> 浏览器原生就能说话，不需要任何后端API。Web Speech API的SpeechSynthesis接口让文本转语音只需3行代码——但真正生产级的实现要处理语音选择、速率控制、队列管理和浏览器兼容。今天我们做一个完整的TTS组件。

## 组件是什么

文本转语音（Text to Speech, TTS）将文字转换为语音播放。Web Speech API从Chrome 33起原生支持，完全免费、离线可用、零依赖。

典型应用场景：
- 无障碍辅助：为视障用户朗读页面内容
- 语言学习：发音示范
- 长文阅读：解放双眼
- 语音通知：配合WebSocket实时播报

## 效果预览

```html
<div class="tts-player">
  <textarea placeholder="Type something to speak..."></textarea>
  <div class="tts-controls">
    <select class="tts-voice"></select>
    <input type="range" class="tts-rate" min="0.5" max="2" step="0.1" value="1">
    <button class="tts-play">Play</button>
    <button class="tts-stop">Stop</button>
  </div>
</div>
```

## 代码拆解

### 检测支持

```javascript
if (!('speechSynthesis' in window)) {
  console.warn('Speech Synthesis not supported');
  return;
}
```

Safari和Chrome都支持，但Firefox需要用户交互后才能播放（autoplay policy）。

### 获取语音列表

```javascript
let voices = [];

function loadVoices() {
  voices = speechSynthesis.getVoices();
  const select = document.querySelector('.tts-voice');
  select.innerHTML = '';
  voices.forEach(voice => {
    const option = document.createElement('option');
    option.value = voice.name;
    option.textContent = `${voice.name} (${voice.lang})`;
    if (voice.default) option.selected = true;
    select.appendChild(option);
  });
}

// Chrome异步加载语音，必须监听事件
loadVoices();
speechSynthesis.onvoiceschanged = loadVoices;
```

关键坑：Chrome的`getVoices()`在页面加载时返回空数组，必须监听`onvoiceschanged`事件。

### 核心播放逻辑

```javascript
function speak() {
  const text = document.querySelector('.tts-text').value.trim();
  if (!text) return;

  // 先取消正在播放的
  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const selectedVoice = voices.find(v =>
    v.name === document.querySelector('.tts-voice').value
  );
  if (selectedVoice) utterance.voice = selectedVoice;

  utterance.rate = parseFloat(document.querySelector('.tts-rate').value);
  utterance.pitch = 1;
  utterance.volume = 1;

  // 状态回调
  utterance.onstart = () => updateButtonState('playing');
  utterance.onend = () => updateButtonState('idle');
  utterance.onerror = (e) => {
    console.error('TTS Error:', e.error);
    updateButtonState('idle');
  };

  speechSynthesis.speak(utterance);
}
```

### 暂停和恢复

```javascript
function togglePause() {
  if (speechSynthesis.speaking) {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
      pauseBtn.textContent = 'Pause';
    } else {
      speechSynthesis.pause();
      pauseBtn.textContent = 'Resume';
    }
  }
}
```

### 长文本分块

Chrome有大约15秒的TTS限制，超长文本会被截断。解决方案：

```javascript
function speakLongText(text) {
  const chunks = [];
  const maxLength = 200;

  // 按句号分割，再合并到最大长度
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let current = '';

  sentences.forEach(sentence => {
    if ((current + sentence).length > maxLength) {
      if (current) chunks.push(current);
      current = sentence;
    } else {
      current += sentence;
    }
  });
  if (current) chunks.push(current);

  // 逐块播放
  let index = 0;
  function playNext() {
    if (index >= chunks.length) return;
    const utterance = new SpeechSynthesisUtterance(chunks[index]);
    utterance.onend = () => {
      index++;
      playNext();
    };
    speechSynthesis.speak(utterance);
  }
  playNext();
}
```

## 关键技术点

1. **onvoiceschanged**：Chrome异步加载语音列表，必须监听此事件
2. **cancel before speak**：连续调用speak()会排队，先cancel()清空队列
3. **autoplay policy**：Safari/Chrome要求用户交互后才能播放，不能页面加载自动播
4. **长文本截断**：Chrome约15秒限制，需分块播放
5. **速率控制**：rate范围0.1-10，推荐0.5-2，过快不可读

## 常见坑点

- **voiceschanged不触发**：Safari中该事件可能不触发，用setTimeout延迟重试
- **暂停后无法恢复**：部分Chrome版本pause()/resume()有bug，用cancel()+重新speak()降级
- **中文语音缺失**：Linux系统可能没有中文语音包，需检测并提示用户
- **移动端限制**：iOS Safari每次speak()必须由用户手势触发，不能链式自动播放
- **内存泄漏**：SpeechSynthesisUtterance对象播放完会被GC，但onend闭包可能持有引用，手动置null

## 完整可复制代码

```html
<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Text to Speech</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,sans-serif;background:#f5f5f7;display:flex;align-items:center;justify-content:center;min-height:100vh}
.tts-player{background:#fff;border-radius:16px;padding:24px;box-shadow:0 2px 12px rgba(0,0,0,0.08);width:90%;max-width:500px}
.tts-text{width:100%;height:100px;padding:12px;border:2px solid #e0e0e0;border-radius:8px;font-size:14px;resize:none;outline:none;transition:border-color 0.3s}
.tts-text:focus{border-color:#6c5ce7}
.tts-controls{display:flex;gap:8px;margin-top:12px;align-items:center;flex-wrap:wrap}
.tts-voice{padding:8px;border:2px solid #e0e0e0;border-radius:8px;background:#fff;font-size:13px;max-width:180px}
.tts-rate{width:100px}
.tts-btn{padding:8px 20px;border:none;border-radius:8px;font-size:14px;cursor:pointer;transition:opacity 0.2s}
.tts-btn:disabled{opacity:0.5;cursor:not-allowed}
.tts-play{background:#6c5ce7;color:#fff}
.tts-stop{background:#e74c3c;color:#fff}
.tts-pause{background:#f39c12;color:#fff}
</style>
</head>
<body>
<div class="tts-player">
<textarea class="tts-text" placeholder="Type something to speak...">Hello, this is a text to speech demo.</textarea>
<div class="tts-controls">
<select class="tts-voice"></select>
<input type="range" class="tts-rate" min="0.5" max="2" step="0.1" value="1" title="Speed">
<button class="tts-btn tts-play" onclick="ttsSpeak()">Play</button>
<button class="tts-btn tts-pause" onclick="ttsPause()">Pause</button>
<button class="tts-btn tts-stop" onclick="ttsStop()">Stop</button>
</div>
</div>
<script>
var voices=[];
function loadVoices(){
  voices=speechSynthesis.getVoices();
  var sel=document.querySelector('.tts-voice');
  sel.innerHTML='';
  voices.forEach(function(v){var o=document.createElement('option');o.value=v.name;o.textContent=v.name+' ('+v.lang+')';if(v.default)o.selected=true;sel.appendChild(o)});
}
loadVoices();
if('speechSynthesis'in window)speechSynthesis.onvoiceschanged=loadVoices;
function ttsSpeak(){
  var t=document.querySelector('.tts-text').value.trim();if(!t)return;
  speechSynthesis.cancel();
  var u=new SpeechSynthesisUtterance(t);
  var sv=voices.find(function(v){return v.name===document.querySelector('.tts-voice').value});
  if(sv)u.voice=sv;
  u.rate=parseFloat(document.querySelector('.tts-rate').value);
  speechSynthesis.speak(u);
}
function ttsPause(){if(speechSynthesis.speaking){if(speechSynthesis.paused)speechSynthesis.resume();else speechSynthesis.pause()}}
function ttsStop(){speechSynthesis.cancel()}
</script>
</body>
</html>
```

## 变体拓展

- **高亮当前朗读词**：用utterance.onboundary事件获取当前word位置，高亮对应DOM文本
- **多语言自动切换**：检测文本语言，自动选择对应voice
- **下载音频**：虽然Web Speech API不能直接导出音频，但可以用MediaRecorder+AudioContext捕获
- **语音命令**：配合SpeechRecognition实现双向语音交互

---

> The browser can speak natively — no backend API needed. The Web Speech API's SpeechSynthesis interface makes text-to-speech possible with 3 lines of code — but a production-grade implementation needs voice selection, rate control, queue management, and browser compat handling.

## What Is It

Text to Speech (TTS) converts text into spoken audio. The Web Speech API has been natively supported since Chrome 33 — completely free, offline-capable, zero dependencies.

## Key Technical Points

1. **onvoiceschanged**: Chrome loads voice list asynchronously, must listen for this event
2. **cancel before speak**: Consecutive speak() calls queue up — cancel() first
3. **autoplay policy**: Safari/Chrome require user interaction before playing
4. **Long text truncation**: Chrome ~15s limit, need chunking
5. **Rate control**: Range 0.1-10, recommended 0.5-2

## Common Pitfalls

- **voiceschanged not firing**: Use setTimeout retry on Safari
- **Pause/resume bug**: Some Chrome versions have bugs, use cancel()+re-speak() fallback
- **Missing Chinese voice**: Linux may lack voice packs, detect and prompt
- **iOS restrictions**: Each speak() must be triggered by user gesture
- **Memory leak**: Manually null utterance references in callbacks

---

*更多Web组件，请访问 [Web组件字典](https://wdsega.github.io/web-components/widget.html)。*
