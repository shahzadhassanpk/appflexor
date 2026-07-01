import React, { useState, useEffect } from "react";
function voiceTag(prepend,append) {
    this.prepend = prepend;
    this.append = append;
  }
const TextToSpeech = ({ text }) => {
    
  const [isPaused, setIsPaused] = useState(false);
  const [utterance, setUtterance] = useState(null);
  var voiceTags = new Array();
  voiceTags["q"] = new voiceTag("quote,",", unquote,");
  voiceTags["ol"] = new voiceTag("Start of list.","End of list.");
  voiceTags["ul"] = new voiceTag("Start of list.","End of list.");
  voiceTags["blockquote"] = new voiceTag("Blockquote start.","Blockquote end.");
  voiceTags["img"] = new voiceTag("There's an embedded image with the description,","");
  voiceTags["table"] = new voiceTag("There's an embedded table with the caption,","");
  voiceTags["figure"] = new voiceTag("There's an embedded figure with the caption,","");
  var ignoreTags = ["audio","button","canvas","code","del","dialog","dl","embed","form","head","iframe","meter","nav","noscript","object","s","script","select","style","textarea","video"];
  
  useEffect(() => {
    const synth = window.speechSynthesis;
    const u = new SpeechSynthesisUtterance(text.replace(/<[^>]*>/g, ''));

    setUtterance(u);

    return () => {
      synth.cancel();
    };
  }, [text]);

  const handlePlay = () => {
    const synth = window.speechSynthesis;

    if (isPaused) {
      synth.resume();
    }

    synth.speak(utterance);

    setIsPaused(false);
  };

  const handlePause = () => {
    const synth = window.speechSynthesis;

    synth.pause();

    setIsPaused(true);
  };

  const handleStop = () => {
    const synth = window.speechSynthesis;

    synth.cancel();

    setIsPaused(false);
  };

  return (
    <div>
      <button onClick={handlePlay}>{isPaused ? "Resume" : "Play"}</button>
      <button onClick={handlePause}>Pause</button>
      <button onClick={handleStop}>Stop</button>
    </div>
  );
};

export default TextToSpeech;