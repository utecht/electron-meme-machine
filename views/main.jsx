'use babel';

import React from 'react';
import FilePicker from './file_picker.jsx';
const ffmpeg = require('ffmpeg-static');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const parser = require('subtitles-parser');
const {shell} = require('electron');

export default class Main extends React.Component {
    constructor(props){
        super(props);
        this.setWorkingDirectory = this.setWorkingDirectory.bind(this);
        this.setCurrentFile = this.setCurrentFile.bind(this);
        this.setSubs = this.setSubs.bind(this);
        this.ffmpeg_it = this.ffmpeg_it.bind(this);
        this.showIt = this.showIt.bind(this);
        this.setStart = this.setStart.bind(this);
        this.setEnd = this.setEnd.bind(this);
        this.setText = this.setText.bind(this);
        this.state = {working_directory: '',
                      current_file: '',
                      srt_file: '',
                      ffmpeg_path: ffmpeg.path,
                      ffmpeg_output: '',
                      ffmpeg_complete: false,
                      ss: '',
                      end: '',
                      text: '',
                      subs: []};
    }

    showIt(){
        shell.showItemInFolder(this.state.working_directory + '/test.mp4');
    }

    quickSet(sub){
        this.setStart(sub.startTime.replace(',', '.'));
        this.setEnd(sub.endTime.replace(',', '.'));
        this.setText(sub.text);
    }

    setStart(time){
        this.setState({ss: time});
    }

    setEnd(time){
        this.setState({end: time});
    }

    setText(text){
        this.setState({text: text});
    }

    setWorkingDirectory(path){
        this.setState({working_directory: path});
    }

    setCurrentFile(path){
        this.setState({current_file: path});
    }

    setSubs(path){
        var srt = fs.readFileSync(path, 'utf8');
        var data = parser.fromSrt(srt);
        this.setState({subs: data});
    }

    ffmpeg_it(){
        this.setState({ffmpeg_output: ''});
        var proc = spawn(this.state.ffmpeg_path, [
                                       '-ss', this.state.ss,
                                       '-i', this.state.current_file,
                                       '-to', this.state.end,
                                       '-y',
                                       this.state.working_directory + '/test.mp4']);
        proc.stderr.on('data', (data) => {
            this.setState({ffmpeg_output: this.state.ffmpeg_output + `${data}`});
        });
        proc.on('close', (code) => {
            this.setState({ffmpeg_complete: true});
        });
    }

    render() {
        return <div>
                    <p>{this.state.ffmpeg_path}</p>
                    <h5>Working Path: {this.state.working_directory}</h5>
                    <FilePicker
                        directory={true}
                        text={"Set Working Directory"}
                        setFilePath={this.setWorkingDirectory}/>
                    <h5>Current File: {this.state.current_file}</h5>
                    <FilePicker
                        directory={false}
                        text={"Select Video"}
                        setFilePath={this.setCurrentFile}/>
                    <FilePicker
                        directory={false}
                        text={"Select Subs"}
                        setFilePath={this.setSubs}/>
                    <button onClick={this.ffmpeg_it}>ffmpeg it</button>
                    <button onClick={this.showIt}>show it</button>
                    <p>ffmpeg is {this.state.ffmpeg_complete ? 'complete' : 'not complete'}</p>
                    <div>
                        { this.state.ffmpeg_complete ?(
                            <video controls>
                                <source src={this.state.working_directory + '/test.mp4'}/>
                                no video?
                            </video>
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
