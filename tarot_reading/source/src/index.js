import React from 'react';
import ReactDOM from 'react-dom';

async function getBitRandomAsync(i) {
	var xhr = new XMLHttpRequest();
	return new Promise (function(resolve, reject) {
		
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				if (xhr.Status >= 300) {
					reject("Error, status code = " + xhr.status)
				}
				else {
					let tSplit = xhr.responseText.toString().trim().split("\n");
					let tBin = tSplit.map( x => (x==="0") );
					resolve(tBin);
				}
			}
		}
		
		xhr.open('GET', "https://www.random.org/integers/?num="+ i +"&min=0&max=1&col=1&base=10&format=plain&rnd=new", true);
		// send the request
		xhr.send();
	});
}

async function getDeckRandomAsync(i) {
	var xhr = new XMLHttpRequest();
	return new Promise (function(resolve, reject) {
		
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				if (xhr.Status >= 300) {
					reject("Error, status code = " + xhr.status)
				}
				else {
					let tSplit = xhr.responseText.toString().trim().split("\n");
					let tInt = tSplit.map( x => parseInt(x) );
					resolve(tInt);
				}
			}
		}
		
		xhr.open('GET', "https://www.random.org/sequences/?min=0&max="+i+"&col=1&format=plain&rnd=new", true);
		// send the request
		xhr.send();
	});
}

function Card(props) {

	let name = '';
	
	if (props.cardNo === -1) {
		name = 'back.jpg';
	}
	else if (props.cardNo === 10) {
		name = props.isUp ? 't10a.jpg' : 't10b.jpg';
	}
	else {
		name = 't' + props.cardNo + '.jpg'
	}
	
	name = "img/"+ name;
	
	return (
		<img src={name} alt={name} height="200"></img>
	);
		
}

class Board extends React.Component {
	renderCard(i) {
		return( <Card cardNo={this.props.cardNo[i]} isUp={this.props.isUp[i]} />  );
	}
	
	renderToken(i) {
		return( this.props.isToken[i] ? <img src="img/token.jpg" alt="*" height="50"></img> : "" );
	}
	
	render() {
		return(
			<div class="container-fluid">
				<div class="row text-center">
					<div class="col-sm-2"> {this.renderCard(0)} </div>
					<div class="col-sm-2"> {this.renderCard(1)} </div>
					<div class="col-sm-2"> {this.renderCard(2)} </div>
					<div class="col-sm-2"> {this.renderCard(3)} </div>
					<div class="col-sm-2"> {this.renderCard(4)} </div>
				</div>
				
				<div class="row text-center">
					<div class="col-sm-2"> {this.renderToken(0)} </div>
					<div class="col-sm-2"> {this.renderToken(1)} </div>
					<div class="col-sm-2"> {this.renderToken(2)} </div>
					<div class="col-sm-2"> {this.renderToken(3)} </div>
					<div class="col-sm-2"> {this.renderToken(4)} </div>
				</div>
			</div>
		);
	}
}

class TarotRead extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			cardNo: Array(5).fill(-1),
			isUp: Array(5).fill(true),
			isToken: Array(5).fill(false),
			tokenNo: 0,
			timeRnd: 100,
			randomthings: 0,
		}
	}
	
	restartBoard() {
		this.setState({
			cardNo: Array(5).fill(-1),
			isUp: Array(5).fill(true),
			isToken: Array(5).fill(false),
			tokenNo: 0,
			timeRnd: 100,
		});
	}
	
	
	async startReading() {
		let tokenList = Array(5).fill(false);
		let cardList = Array(5).fill(-1);
		let upList = Array(5).fill(true);
		
		//let randomList = Array(51).fill(-1);
		//let binaryList = Array(6).fill(-1);
		let tokenCard = 0;
		
		if (this.state.tokenNo===0) {
			alert("Please select a token");
		}
		else {
			let i = 0;
			//let randomNo;
			
			let binaryList = await getBitRandomAsync(6);
			let randomList = await getDeckRandomAsync(49);
			console.log(await binaryList);
			console.log(await randomList);
			

	
/* 			while (i<7) { // This will be replaced by the call to RANDOM.ORG
				randomNo = Math.floor(Math.random() * 50);
				if (!randomList.includes(randomNo)) {
					randomList[i] = randomNo;
					i++;
				}
			}
			
			for (i=0; i<6; i++) { // This will be replaced by the call to RANDOM.ORG
				binaryList[i] = Math.floor(Math.random() * 50) % 2;
			}
			
			console.log(randomList);
			console.log(binaryList); */
			
 			// type of the token
			let typeToken = binaryList[5];
			
			// position of the token
			let positionToken = randomList[49] % 5;
			
			if (this.state.tokenNo===1) {
				tokenCard = (typeToken===0) ? 25 : 24;
			}
			else if (this.state.tokenNo===2) {
				tokenCard = (typeToken===0) ? 26 : 23;
			}
			else {
				alert("Please select a token");
			}
			
			cardList[positionToken] = tokenCard;
			upList[positionToken] = (binaryList[positionToken]);
			tokenList[positionToken] = true;
			
			// Rest of the cards
			let randomListIdx = 0;
			for (i=0; i<positionToken; i++) { // 1st half
				if (randomList[randomListIdx]===tokenCard) { //skip!
					randomListIdx++;
					console.log("skip!");
				}
				
				cardList[i] = randomList[randomListIdx];
				upList[i] = (binaryList[i]);
				randomListIdx++;
			}
			
			for (i=positionToken+1; i<5; i++) { // 2nd half
				if (randomList[randomListIdx]===tokenCard) { //skip!
					randomListIdx++;
					console.log("skip!");
				}
				
				cardList[i] = randomList[randomListIdx];
				upList[i] = (binaryList[i]);
				randomListIdx++;
			}
		
			this.setState({isToken: tokenList, cardNo: cardList, isUp: upList})
		}
		
		console.log("reading!");
	}
	
	render() {
		return (
			<div class="container-fluid">
				<div class="row text-center">
					<div class="col-sm-6"> <img src="img/t25.jpg" alt="King" height="200"></img></div>
					<div class="col-sm-6"> <img src="img/t26.jpg" alt="Queen" height="200"></img></div>
				</div>
				
				<div class="row text-center">
					<div class="col-sm-6"> <button type="button" class="btn" onClick={() => this.setState({tokenNo: 1})}> {this.state.tokenNo===1 ? "X" : "_"} </button> </div>
					<div class="col-sm-6"> <button type="button" class="btn" onClick={() => this.setState({tokenNo: 2})}> {this.state.tokenNo===2 ? "X" : "_"} </button></div>
				</div>
				
				<div class="row text-center">
					<button type="button" class="btn btn-success" onClick={() => this.startReading()}> Start </button> &emsp;
					<button type="button" class="btn btn-warning" onClick={() => this.restartBoard()}> Clear </button>
				</div>
				
				<Board cardNo={this.state.cardNo} isUp={this.state.isUp} isToken={this.state.isToken}/>
			</div>
		);
	}
}

ReactDOM.render(<TarotRead />, document.getElementById("root"));