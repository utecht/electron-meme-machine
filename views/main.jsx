'use babel';

import React from 'react';
import FilePicker from './file_picker.jsx';
const { remote } = require('electron');
const ffmpeg = require('ffmpeg-static');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const parser = require('subtitles-parser');
const {shell} = require('electron');
const opensubs = require('opensubtitles-api');
const fontManager = require('font-manager');

export default class Main extends React.Component {
    constructor(props){
        super(props);
        this.setWorkingDirectory = this.setWorkingDirectory.bind(this);
        this.setCurrentFile = this.setCurrentFile.bind(this);
        this.setSubs = this.setSubs.bind(this);
        this.extract_subs = this.extract_subs.bind(this);
        this.ffmpeg_it = this.ffmpeg_it.bind(this);
        this.showIt = this.showIt.bind(this);
        this.setStart = this.setStart.bind(this);
        this.setDuration = this.setDuration.bind(this);
        this.setText = this.setText.bind(this);
        this.clearState = this.clearState.bind(this);
        this.handleChange = this.handleChange.bind(this);
        /*
        this.OpenSubtitles = new opensubs({
          useragent: 'OSTestUserAgentTemp',
          username: 'thenmal',
          password: '4cb9c8a8048fd02294477fcb1a41191a',
          ssl: true
        });
        this.OpenSubtitles.login().then(res => {
          this.token = res.token;
        })
        */
        document.ondragover = document.ondrop = (ev) => {
          ev.preventDefault()
        }

        document.body.ondrop = (ev) => {
          this.setCurrentFile(ev.dataTransfer.files[0].path);
          ev.preventDefault()
        }
        var font = fontManager.findFontSync({family: 'Impact'});
        this.state = {working_directory: this.initializeWorking(),
                      current_file: '',
                      srt_file: '',
                      ffmpeg_path: ffmpeg.path,
                      ffmpeg_output: '',
                      font_path: font.path,
                      show_video: false,
                      ss: '',
                      t: '',
                      text: '',
                      format: 'mp4',
                      subs: []};
        this.initializeWorking();
    }

    initializeWorking(){
      var tmp = remote.app.getPath('temp');
      if(fs.existsSync(tmp) != true){
        fs.mkdirSync(tmp);
      }
      return tmp;
    }

    showIt(){
        shell.showItemInFolder(this.state.working_directory + 'test.' + this.state.format);
    }

    quickSet(sub){
        this.setStart(sub.startTime.replace(',', '.'));
        this.setDuration(sub.startTime, sub.endTime);
        this.setText(sub.text);
    }

    setStart(time){
        this.setState({ss: time});
    }

    toMS(srtTime) {
        var match = srtTime.match(/^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/);

        if (!match) {
          throw new Error('Invalid SRT time format');
        }

        var hours = parseInt(match[1], 10);
        var minutes = parseInt(match[2], 10);
        var seconds = parseInt(match[3], 10);
        var milliseconds = parseInt(match[4], 10);

        hours *= 3600000;
        minutes *= 60000;
        seconds *= 1000;

        return hours + minutes + seconds + milliseconds;
    }

    toFFMPEGTime(milliseconds) {
      if (!/^\d+$/.test(milliseconds.toString())) {
        throw new Error('Time should be an Integer value in milliseconds');
      }

      milliseconds = parseInt(milliseconds);

      var date = new Date(0, 0, 0, 0, 0, 0, milliseconds);

      var hours = date.getHours() < 10
        ? '0' + date.getHours()
        : date.getHours();

      var minutes = date.getMinutes() < 10
        ? '0' + date.getMinutes()
        : date.getMinutes();

      var seconds = date.getSeconds() < 10
        ? '0' + date.getSeconds()
        : date.getSeconds();

      var ms = milliseconds - ((hours * 3600000) + (minutes * 60000) + (seconds * 1000));

      if (ms < 100 && ms >= 10) {
        ms = '0' + ms;
      } else if (ms < 10) {
        ms = '00' + ms;
      }

      var srtTime = hours + ':' + minutes + ':' + seconds + '.' + ms;

      return srtTime;
    }

    clearState(){
      this.setState({ss: '', t: '', text: '',
                     current_file: '', ffmpeg_output: '',
                     subs: [], srt_file: '',
                     show_video: false})
    }

    setDuration(start, end){
        var duration = this.toMS(end) - this.toMS(start);
        this.setState({t: this.toFFMPEGTime(duration)});
    }

    setText(text){
        var cleaned_text = text.replace(/<[^>]*>/g, '');
        cleaned_text = cleaned_text.replace('– ', '');
        this.setState({text: cleaned_text});
    }

    setWorkingDirectory(path){
        this.setState({working_directory: path});
    }

    handleChange(event) {
      const name = event.target.name;
      this.setState({[name]: event.target.value});
    }

    setCurrentFile(path){
        /*
        this.OpenSubtitles.identify({
          path: path,
          extend: true
        }).then(data => {
          console.log(data);
          this.OpenSubtitles.api.CheckMovieHash2(this.token, [data.moviehash]).then(info => {
            console.log(info);
          });
        });
        */
        this.setState({current_file: path});
    }

    extract_subs(){
      this.setState({ffmpeg_output: ''});
      if(this.state.current_file === '') return;
      var sub_path = this.state.working_directory + 'subs.srt';

      var proc = spawn(this.state.ffmpeg_path,
        ['-i', this.state.current_file,
        '-map', '0:s:0', '-y', sub_path]);
      proc.stderr.on('data', (data) => {
          this.setState({
            ffmpeg_output: this.state.ffmpeg_output + `${data}`});
      });
      proc.on('close', (code) => {
          if(code === 0){
            this.setSubs(sub_path);
          }
      });
    }

    setSubs(path){
        var srt = fs.readFileSync(path, 'utf8');
        var data = parser.fromSrt(srt);
        this.setState({subs: data});
    }

    ffmpeg_it(){
        this.setState({ffmpeg_output: '', show_video: false});
        var args = [];
        if(this.state.ss !== ''){
          args.push('-ss');
          args.push(this.state.ss);
        }
        if(this.state.t !== ''){
          args.push('-t');
          args.push(this.state.t);
        }
        args.push('-i');
        args.push(this.state.current_file);
        args.push('-y');
        if(this.text !== ''){
          var text_path = this.state.working_directory + 'LINE';
          var longest_line = this.state.text.split('\n')
                                .sort(function(arg1, arg2){
                                  return arg1.length + arg2.length
                                })[0];
          var font_size = parseInt((28 / longest_line.length) * 50);
          if(font_size > 50){
            font_size = 50;
          }
          fs.writeFileSync(text_path, this.state.text);
          args.push('-vf');
          args.push('drawtext=fontfile=' + this.state.font_path +
                    ':textfile=' + text_path +
                    ':fontcolor=white:fontsize=' + font_size +
                    ':x=(w-text_w)/2:y=((h*1.75)-text_h)/2:borderw=3');
        }
        args.push(this.state.working_directory + 'test.' + this.state.format);
        var proc = spawn(this.state.ffmpeg_path, args);
        proc.stderr.on('data', (data) => {
            this.setState({ffmpeg_output:
              this.state.ffmpeg_output + `${data}`});
        });
        proc.on('close', (code) => {
            if(code === 0){
              this.setState({show_video: true});
            }
        });
    }

    render() {
        return <div>
                    <FilePicker
                        directory={true}
                        text={"Change Working Directory"}
                        setFilePath={this.setWorkingDirectory}/>
                    <span>Current working directory: {this.state.working_directory}</span>
                    { this.state.current_file === '' ?(
                      <div>
                        <FilePicker
                            directory={false}
                            text={"Select Video"}
                            setFilePath={this.setCurrentFile}/>
                        <span>or drop video file onto window</span>
                      </div>
                    ) : (
                      <div>
                        <h5>Current File: {this.state.current_file}</h5>
                        <button onClick={this.extract_subs}>Extract Subs</button>
                      </div>
                    )}
                    <FilePicker
                        directory={false}
                        text={"Select SRT file"}
                        setFilePath={this.setSubs}/>
                    <label>-ss</label><input name="ss" value={this.state.ss} onChange={this.handleChange}></input>
                    <label>-t</label><input name="t" value={this.state.t} onChange={this.handleChange}></input>
                    <br/>
                    <label>text</label><textarea name="text" value={this.state.text} onChange={this.handleChange}></textarea>
                    <br/>
                    <select name="format" value={this.state.format} onChange={this.handleChange}>
                      <option value="mp4">mp4</option>
                      <option value="gif">gif</option>
                    </select>
                    <button onClick={this.ffmpeg_it}>ffmpeg it</button>
                    <button onClick={this.showIt}>show file in system browser</button>
                    <button onClick={this.clearState}>clear all</button>
                    <div>
                        { this.state.show_video ? (
                            <div>
                              { this.state.format === 'mp4' ? (
                                <video controls>
                                    <source src={this.state.working_directory + 'test.' + this.state.format}/>
                                    no video?
                                </video>
                              ):(
                                <img src={this.state.working_directory + 'test.' + this.state.format}/>
                              )}
                            </div>
                        ) : (<p>video not ready</p>) }
                    </div>
                    <table>
                        <tbody>
                            {this.state.subs.map((x, i) =>
                                <tr key={x.id}>
                                    <td>{x.id}</td>
                                    <td>{x.text}</td>
                                    <td><button onClick={() => this.quickSet(x)}>Set</button></td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <pre>{this.state.ffmpeg_output}</pre>
                </div>;
    }
}
