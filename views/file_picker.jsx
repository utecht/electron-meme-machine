'use babel';

import React from 'react';
const { dialog } = require('electron').remote;

export default class FilePicker extends React.Component {
    constructor(props){
        super(props);
        this.setFilePath = this.setFilePath.bind(this);
    }

    setFilePath(){
        if(this.props.directory){
            var working_path = dialog.showOpenDialog({properties: ['openDirectory', 'createDirectory']})[0];
        } else {
            var working_path = dialog.showOpenDialog()[0];
        }
        this.props.setFilePath(working_path);
    }

    render() {
        return <div className="file_picker">
                <button onClick={this.setFilePath}>{this.props.text}</button>
                </div>;
    }
}
