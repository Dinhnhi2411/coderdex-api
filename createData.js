const fs = require("fs");
const csv = require("csvtojson");
const { faker } = require("@faker-js/faker");

const createData = async () => {
  let data = JSON.parse(fs.readFileSync("db.json"));

  let newData = await csv().fromFile("pokemon.csv");
  newData = new Set(newData);
  newData = Array.from(newData);
  newData = newData.slice(0, 721);

  newData = newData.map((pokemon, index) => {
    let description = faker.lorem.sentence();
    const pokemonName =
      pokemon.name.charAt(0).toLowerCase() + pokemon.name.slice(1);
    console.log(newData);
    if (data.type2) {
      return {
        id: index + 1,
        name: pokemonName,
        description: description,
        height: `${pokemon.height_m} '`,
        weight: `${pokemon.weight_kg} .lbs`,
        abilities: pokemon.abilities,
        types: [pokemon.type1, pokemon.type2],
        url: `http://localhost:8000/images/${index + 1}.jpg`,
      };
    } else {
      return {
        id: index + 1,
        name: pokemonName,
        description: description,
        height: `${pokemon.height_m} '`,
        weight: `${pokemon.weight_kg} .lbs`,
        abilities: pokemon.abilities,
        types: [pokemon.type1],
        url: `http://localhost:8000/images/${index + 1}.jpg`,
      };
    }
  });

  data.totalPokemons = newData.length;

  data.data = newData;

  fs.writeFileSync("db.json", JSON.stringify(data));
};

createData();
