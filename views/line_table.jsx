'use babel';

import React from 'react';

export default class LineTable extends React.Component {
    constructor(props){
        super(props);
        this.setStart = this.setStart.bind(this);
        this.setEnd = this.setEnd.bind(this);
        this.setText = this.setText.bind(this);
        this.quickSet = this.quickSet.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.state = { search: '' };
    }

    setStart(start){
      this.props.setStart(start);
    }

    setEnd(end){
      this.props.setEnd(end);
    }

    setText(text){
      this.props.setText(text);
    }

    quickSet(x){
        this.props.quickSet(x);
    }

    handleChange(event) {
      const name = event.target.name;
      this.setState({[name]: event.target.value});
    }

    render() {
        return <div>
         <label>Search</label><input name="search" value={this.state.search} onChange={this.handleChange}></input>
         <table>
            <tbody>
                {this.props.subs.map((x, i) =>
                    <tr key={x.id}>
                        <td>{x.id}</td>
                        <td onClick={() => this.setText(x.text)}>{x.text}</td>
                        <td>
                            <span onClick={() => this.setStart(x.startTime)}>{x.startTime}</span>
                            <span> --> </span>
                            <span onClick={() => this.setEnd(x.endTime)}>{x.endTime}</span>
                        </td>
                        <td><button onClick={() => this.quickSet(x)}>Set</button></td>
                    </tr>
                )}
            </tbody>
        </table>
        </div>;
    }
}
