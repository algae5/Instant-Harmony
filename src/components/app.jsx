/* eslint-disable no-restricted-globals */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable no-undef */
import React from 'react';
import axios from 'axios';

export default function App() {
  const [sequence, updateSequence] = React.useState({});
  const [key, updateKey] = React.useState('C');
  const [saved, updateSaved] = React.useState(false);
  const [time, updateTime] = React.useState(0);
  const [duration, updateDuration] = React.useState(0);
  // // Set the function as message callback
  MIDIjs.player_callback = (e) => {
    updateTime(e.time);
  };

  const stopMidi = () => {
    console.log('stopping');
    MIDIjs.stop();
    updateTime(0);
  };

  const formatChordNotation = (str) => {
    for (let i = 0; i < str.length; i += 1) {
      const romanNumerals = ['I', 'i', 'V', 'v'];
      if (!romanNumerals.includes(str[i])) {
        return [str.slice(0, i), str.slice(i)];
      }
    }
    return [str];
  };

  const generateNewMidi = () => {
    // console.log('generating new sequence:');
    stopMidi();
    let body;
    if (saved) {
      body = { key, id: '' };
      updateSaved(false);
    } else {
      body = { key, id: sequence.id };
    }
    axios.post('/newfile', body)
      .then((results) => {
        // console.log(results.data.results);
        // console.log(results.data.id);
        const newResults = results.data.results.split('\n');
        newResults.pop();
        newResults.pop();
        updateSequence({
          results: newResults.map(formatChordNotation),
          id: results.data.id,
        });
        MIDIjs.get_duration(`file/${results.data.id}.mid`, (output) => {
          updateDuration(output);
        });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const mount = () => {
    if (location.hash[0] === '#') {
      updateSaved(true);
      updateSequence({ id: location.hash.slice(1) });
    } else {
      generateNewMidi();
    }
  };

  React.useEffect(mount, []);

  const saveSequence = () => {
    // console.log('saving sequence:');
    window.location.href = `#${sequence.id}`;
    axios.post(`/savefile/${sequence.id}`)
      .then(() => {
        updateSaved(true);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const playMidi = () => {
    if (saved) {
      MIDIjs.play(`saved/${sequence.id}.mid`);
      MIDIjs.get_duration(`saved/${location.hash.slice(1)}.mid`, (results) => {
        updateDuration(results);
      });
    } else {
      MIDIjs.play(`file/${sequence.id}.mid`);
    }
  };

  return (
    <div className="AppContainer">
      <label className="SelectKey">
        Key Signature:
        <select name="key" id="keySelect" onChange={(e) => updateKey(e.target.value)}>
          <option value="C">C</option>
          <option value="C#">C#</option>
          <option value="D">D</option>
          <option value="Eb">Eb</option>
          <option value="E">E</option>
          <option value="F">F</option>
          <option value="F#">F#</option>
          <option value="G">G</option>
          <option value="G#">G#</option>
          <option value="A">A</option>
          <option value="Bb">Bb</option>
          <option value="B">B</option>
        </select>
      </label>
      <div className="generate">
        <button className="btn btn-primary generator" type="button" onClick={() => generateNewMidi()}>
          Generate New Sequence
        </button>
      </div>
      {sequence.id && (
        <div className="MusicPlayer">
          {duration !== 0 && (
            <div className="progress">
              <div
                className="progress-bar"
                role="progressbar"
                aria-valuenow={Math.min(time, duration)}
                aria-valuemin="0"
                aria-valuemax={duration}
                style={{
                  width: `${Math.min((time / duration), duration) * 100}%`,
                  // minWidth: '3.5em',
                }}
              >
                {`${Math.min(duration, Math.floor(time))}s/${duration}s`}
              </div>
            </div>
          )}
          <div className="Play">
            <button className="btn btn-success btn-lg" type="button" onClick={() => playMidi()}>
              ►
            </button>
          </div>
          <div className="Stop">
            <button className="btn btn-danger btn-lg" type="button" onClick={() => stopMidi()}>
              ◼
            </button>
          </div>
        </div>
      )}
      <div className="HarmonicSequence">
        {(sequence.results && sequence.results[Math.floor(time)]) && (
          <div>
            {sequence.results[Math.floor(time)][0]}
            <sub>{sequence.results[Math.floor(time)][1]}</sub>
          </div>
        )}
      </div>
      <div className="Save">
        {(!saved && sequence.id) && (
          <button className="btn btn-info" type="button" onClick={() => saveSequence()}>
            Save
          </button>
        )}
        {saved && (
          <div>
            Saved at:
            <a href={`https://instant-harmony.herokuapp.com/#${sequence.id}`}>
              {` https://instant-harmony.herokuapp.com/#${sequence.id}`}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
