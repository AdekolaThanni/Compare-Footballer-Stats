"use strict";
// Setting header
const api_key = "607daa450199c47cbd242e58832d8fe8";
const myHeaders = new Headers();
myHeaders.append("x-rapidapi-key", api_key);
myHeaders.append("x-rapidapi-host", "v3.football.api-sports.io");

const requestOptions = {
  method: "GET",
  headers: myHeaders,
  redirect: "follow",
};

// Elements
const containerForm = document.querySelectorAll(".container__form");
const selects = document.querySelectorAll("select");
const league1 = document.querySelector("#league1");
const team1 = document.querySelector("#team1");
const player1 = document.querySelector("#player1");
const league2 = document.querySelector("#league2");
const team2 = document.querySelector("#team2");
const player2 = document.querySelector("#player2");
const year = document.querySelector("#year");
const compareBtn = document.querySelector(".compare-btn");
const resetBtn = document.querySelector(".btn-reset");
const detailList = document.querySelector(".list--details");
const statList = document.querySelector(".list--stat");
const avatar1 = document.querySelector(".avatar--1");
const avatar2 = document.querySelector(".avatar--2");

// Football app
class FootballApp {
  #player1;
  #player2;
  #year;

  constructor() {
    // Event listener for selection of an item from dropdown
    containerForm.forEach((container) => {
      container.addEventListener("change", this._respondToForm.bind(this));
    });
    // Event listener to reset page
    resetBtn.addEventListener("click", function () {
      location.reload();
    });
  }

  // Response to change in form
  _respondToForm(event) {
    const eventId = event.target.id;
    if (eventId.includes("league")) {
      // Populate teams
      this._populateTeams(event, year.value);
    } else if (eventId.includes("team")) {
      // Populate players
      this._populatePlayers(event);
    } else if (eventId.includes("player")) {
      //Store player id
      if (eventId === "player-1") {
        this.#player1 = event.target.value;
      } else {
        this.#player2 = event.target.value;
      }
    }

    if (!eventId.includes("-")) return;
    this._checkCompletion();
  }

  // Check if form is complete
  _checkCompletion() {
    if (Array.from(selects).some((element) => element.value === "none")) return;
    // Enable compare button
    compareBtn.disabled = false;
    compareBtn.style.opacity = 1;
    // Attach event listener
    this.#year = year.value;
    compareBtn.addEventListener("click", this._renderResults.bind(this));
  }

  _populateTeams(e, season) {
    const getTeams = async function () {
      try {
        const res = await fetch(
          `https://v3.football.api-sports.io/teams?league=${e.target.value}&season=${season}`,
          requestOptions
        );
        const result = await res.json();
        const data = await result.response;

        // Populate
        document.querySelector(
          `#${e.target.id} + select[name="Team"]`
        ).innerHTML = `<option class="options" value="none" disabled hidden selected>Select team...</option>`;
        data.forEach((team) => {
          const html = `<option class="options" value="${team.team.id}">${team.team.name}</option>`;
          document
            .querySelector(`#${e.target.id} + select[name="Team"]`)
            .insertAdjacentHTML("beforeend", html);
        });
      } catch (error) {
        alert(error);
      }
    };
    getTeams();
  }
  _populatePlayers(e) {
    const getPlayers = async function () {
      try {
        const res = await fetch(
          `https://v3.football.api-sports.io/players/squads?team=${e.target.value}`,
          requestOptions
        );
        const result = await res.json();
        const [{ players }] = await result.response;

        // Populate
        document.querySelector(
          `#${e.target.id} + select[name="Player"]`
        ).innerHTML = `<option class="options" value="none" disabled hidden selected>Select player...</option>`;
        players.forEach((player) => {
          const html = `<option class="options" value="${player.id}">${player.name}</option>`;
          document
            .querySelector(`#${e.target.id} + select[name="Player"]`)
            .insertAdjacentHTML("beforeend", html);
        });
      } catch (error) {
        alert(error);
      }
    };
    getPlayers();
  }
  _renderResults() {
    // Toggle display
    this._toggleDisplay();

    const getPlayers = async function (player1, player2, year) {
      const [response1, response2] = await Promise.all([
        fetch(
          `https://v3.football.api-sports.io/players?id=${player1}&season=${year}`,
          requestOptions
        ),
        fetch(
          `https://v3.football.api-sports.io/players?id=${player2}&season=${year}`,
          requestOptions
        ),
      ]);
      const data = await Promise.all([response1.json(), response2.json()]);

      const [result1, result2] = data.map((da) => da.response);
      const [{ player: details1, statistics: stats1 }] = result1;
      const [{ player: details2, statistics: stats2 }] = result2;

      // Populate Details
      const detail1Arr = [
        details1.name,
        details1.age,
        details1.nationality,
        stats1[0].team.name,
      ];

      const detail2Arr = [
        details2.name,
        details2.age,
        details2.nationality,
        stats2[0].team.name,
      ];
      // Layout
      const detailLayout = ["Name", "Age", "Nationality", "Club"];

      detail1Arr.forEach((detail, index) => {
        const html = `
                    <li class="list__item">
                        <span class="detail--1">${detail}</span>
                        <span class="detail--item">${detailLayout[index]}</span>
                        <span class="detail--2">${detail2Arr[index]}</span>
                    </li>
                `;
        detailList.insertAdjacentHTML("beforeend", html);
      });
      avatar1.src = `${details1.photo}`;
      avatar2.src = `${details2.photo}`;

      // Populate stats
      // Get all stats
      function getStat(statObj, statChild, statistics) {
        const aggregate = statObj
          .map((stat) => {
            if (stat[statChild][statistics] === null) return 0;
            else return stat[statChild][statistics];
          })
          .reduce((acc, val) => acc + val, 0);

        return aggregate;
      }

      // Layout
      const statLayout = {
        "Matches Played": ["games", "appearences"],
        Goals: ["goals", "total"],
        Assists: ["goals", "assists"],
        Shots: ["shots", "total"],
        "On Target": ["shots", "on"],
        "Total Passes": ["passes", "total"],
        "Key Passes": ["passes", "key"],
        "Attempted Dribbles": ["dribbles", "attempts"],
        "Successful Dribbles": ["dribbles", "success"],
        "Total Duels": ["duels", "total"],
        "Duels Won": ["duels", "won"],
        "Tackles Made": ["tackles", "total"],
        "Blocks Made": ["tackles", "blocks"],
        Interceptions: ["tackles", "interceptions"],
        "Fouls Drawn": ["fouls", "drawn"],
        "Fouls Commited": ["fouls", "committed"],
        "Penalties Won": ["penalty", "won"],
        "Penalties Scored": ["penalty", "scored"],
        "Penalties Missed": ["penalty", "missed"],
        "Penalties Committed": ["penalty", "commited"],
        "Yellow Cards": ["cards", "yellow"],
        "Red cards": ["cards", "red"],
      };

      // Add to DOM
      Object.keys(statLayout).forEach((statUrl) => {
        const player1Data = getStat(stats1, ...statLayout[statUrl]);
        const player2Data = getStat(stats2, ...statLayout[statUrl]);
        const player1Ratio =
          !player1Data && !player2Data
            ? 50
            : ((player1Data / (player1Data + player2Data)) * 100).toFixed(0);
        const divider = document.createElement("span");
        divider.classList.add("stat--divider");
        divider.style.backgroundImage = `linear-gradient(to right, yellow 0%, yellow ${player1Ratio}%, blue ${player1Ratio}%)`;

        const html = `
                    <li class="list__item list__item--stat">
                        <span class="stat--1">${player1Data}</span>
                        <span class="stat--item">${statUrl}</span>
                        <span class="stat--2">${player2Data}</span>
                        ${divider.outerHTML}
                    </li>
                `;
        statList.insertAdjacentHTML("beforeend", html);
      });
    };
    getPlayers(this.#player1, this.#player2, this.#year);
  }

  // disable all forms
  _toggleDisplay() {
    const elements = [
      ...Array.from(containerForm),
      year,
      compareBtn,
      resetBtn,
      detailList,
      statList,
    ];
    elements.forEach((element) => {
      element.classList.toggle("display");
    });
  }
}

const app = new FootballApp();
app;
