'use babel';

import React from 'react';
import FilePicker from './file_picker.jsx';
const ffmpeg = require('ffmpeg-static');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const parser = require('subtitles-parser');

export default class Main extends React.Component {
    constructor(props){
        super(props);
        this.setWorkingDirectory = this.setWorkingDirectory.bind(this);
        this.setCurrentFile = this.setCurrentFile.bind(this);
        this.setSubs = this.setSubs.bind(this);
        this.ffmpeg_it = this.ffmpeg_it.bind(this);
        this.state = {working_directory: '',
                      current_file: '',
                      srt_file: '',
                      ffmpeg_path: ffmpeg.path,
                      ffmpeg_output: '',
                      ffmpeg_complete: false,
                      ss: '',
                      t: '',
                      text: '',
                      subs: []};
    }

    setWorkingDirectory(path){
        this.setState({working_directory: path});
    }

    setCurrentFile(path){
        this.setState({current_file: path});
    }

    setSubs(path){
        var srt = fs.readFileSync(path, 'utf8');
        console.log(`${srt}`);
        var data = parser.fromSrt(srt);
        this.setState({subs: data});
    }

    ffmpeg_it(){
        this.setState({ffmpeg_output: ''});
        var proc = spawn(this.state.ffmpeg_path, ['-i', this.state.current_file,
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
                    <h5>Current Subs: {this.state.subs_file}</h5>
                    <FilePicker
                        directory={false}
                        text={"Select Subs"}
                        setFilePath={this.setSubs}/>
                    <button onClick={this.ffmpeg_it}>ffmpeg it</button>
                    <p>ffmpeg is {this.state.ffmpeg_complete ? 'complete' : 'not complete'}</p>
                    <div>
                        { this.state.ffmpeg_complete ?(
                            <video controls>
                                <source src={this.state.working_directory + '/test.mp4'}/>
                                no video?
                            </video>
                        ) : (<p>video no ready</p>) }
                    </div>
                    <table>
                        <tbody>
                            {this.state.subs.map((x, i) =>
                                <tr>
                                    <td>{x.id}</td>
                                    <td>{x.text}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <pre>{this.state.ffmpeg_output}</pre>
                </div>;
    }
}
