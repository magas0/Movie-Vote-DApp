import React, { Component } from 'react';
import Web3 from 'web3';
import abi from './abi.json';
import './App.css';

// Assuming the user is running a local node
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
// Address of the deployed contract
const address = "0x067692b77d562f745EdCf2399CFF9494C6EfADDF";
// Addess of the wallet
const account = "0x003075165cD0aD8eeBD3aA4b7b1A29A4FEd87404";
// Get an instance of the deployed smart contract
const deployedContract = web3.eth.contract(abi).at(address);

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      blockNumber: web3.eth.blockNumber,
      ...deployedContract,
      movies: [
        { name: 'Baby Driver', id: 1, votes: 0, image: 'images/movie1.jpg'},
        { name: 'Wonder Woman', id: 2, votes: 0, image: 'images/movie2.jpg'},
        { name: 'A Ghost Story', id: 3, votes: 0, image: 'images/movie3.jpg'}
      ],
      transactions: []
    }

    this.handleMovieVote = this.handleMovieVote.bind(this);
  }

  componentDidMount() {
    // Update the votes after loaded
    this.getMovieVotes();
  }

  // Use contract instance to make call to grab all the votes by movie name
  getMovieVotes() {
    let new_votes = this.state.movies.map( function(movie) {
      movie.votes = deployedContract.totalVotesFor.call(movie.name).toString();
      return movie;
    });

    this.setState({movies: new_votes});
  }

  // Add contract interactions here to the state, this is simply for displaying
  // them in the UI
  handleAddTx(tx) {
    this.setState(prevState => ({
      transactions: [...prevState.transactions, tx]
    }));
  }

  // Use contract instance to add a vote for a movie to the blockchain
  handleMovieVote(movie) {
    var self = this;

    deployedContract.voteForCandidate.sendTransaction(movie,{from: account}, function(error, result) {
      if(error) {
        console.error(error);
        return;
      }

      // This would be a good spot to add some UI change to let the user know you
      // Have successfully added a vote but are waiting for it to be mined
      // You could disable the vote button or load a modal, etc.
      self.handleAddTx(`Transaction Hash: ${result}`);
      self.handleAddTx(`Waiting for data to be mined...`);

      var txhash = result;
      var filter = web3.eth.filter('latest');
      filter.watch(function(error, result) {
        var receipt = web3.eth.getTransactionReceipt(txhash);
        if (receipt.blockNumber) {

          // The transaction has been successfully mined, so we want to collect
          // the movie votes again. This would be a good place to tell the user
          // everything is good (remove modal, enable vote buttons again, etc).
          self.handleAddTx(`Transaction Mined at block: ${receipt.blockNumber}`);
          self.getMovieVotes();
          filter.stopWatching();
        }
      });
    });
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Whats the better movie? Vote!</h1>
        </header>
        <div className="App-intro">
          <div className="container">
            <div className="row">
              {
                this.state.movies.map( (movie) =>
                  <div key={movie.id} className="col-sm">
                    <div className="movie-poster"><img src={movie.image} alt={movie.name} /></div>
                    <div>Votes: {movie.votes}</div>
                    <button type="button" onClick={event => this.handleMovieVote(movie.name)} className="btn btn-primary">Vote!</button>
                  </div>
                )
              }
            </div>
            <div>
              <br /><br />
              Blockchain Actions
              <div className="block-transactions">
                {this.state.transactions.map( (tx, index) =>
                    <div key={index}>{tx}</div>
                  )
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
