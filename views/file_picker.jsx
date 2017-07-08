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
            var diag = dialog.showOpenDialog({properties: ['openDirectory', 'createDirectory']});
        } else {
            var diag = dialog.showOpenDialog();
        }
        if(diag !== undefined){
          this.props.setFilePath(diag[0]);
        }
    }

    render() {
        return <div className="file_picker">
                <button onClick={this.setFilePath}>{this.props.text}</button>
                </div>;
    }
}
