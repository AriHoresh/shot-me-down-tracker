# Shot Me Down Tracker

A simple Express app for tracking the shots you have tried at the bar "Shot Me Down". Users can log in with a name, record each shot along with where it was taken, and view statistics like average shots per day.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   npm start
   ```
Railway and many hosts look for this `start` script to run your app.
3. Visit `http://localhost:3000` in your browser.

Data is stored in a `db.json` file using [lowdb](https://github.com/typicode/lowdb).

### Deploying to Railway
1. Push this repository to GitHub.
2. Create a new Railway project and link it to your repository.
3. Railway will automatically install dependencies with `npm install` and run `npm start`.
4. Once deployed, Railway will give you a public URL for the tracker.
