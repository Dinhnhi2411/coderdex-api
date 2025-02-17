const express = require("express");
const router = express.Router();
const fs = require("fs");

const pokemonTypes = [
  "bug",
  "dragon",
  "fairy",
  "fire",
  "ghost",
  "ground",
  "normal",
  "psychic",
  "steel",
  "dark",
  "electric",
  "fighting",
  "flyingText",
  "grass",
  "ice",
  "poison",
  "rock",
  "water",
];
// GET ALL POKEMONS

router.get("/", (req, res, next) => {
  const allowedFilter = ["type", "search", "page", "limit"];
  try {
    let { page, limit, ...filterQuery } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 20;

    const filterKeys = Object.keys(filterQuery);
    filterKeys.forEach((key) => {
      if (!allowedFilter.includes(key)) {
        const exception = new Error(`Query ${key} is not allowed`);
        exception.statusCode = 401;
        throw exception;
      }
      if (!filterQuery[key]) delete filterQuery[key];
    });

    let indexSearch = filterKeys.indexOf("search");
    if (indexSearch !== -1) {
      filterKeys[indexSearch] = "name";
    }
    filterQuery["name"] = filterQuery["search"];
    delete filterQuery["search"];

    let indexType = filterKeys.indexOf("type");
    if (indexType !== -1) {
      filterKeys[indexType] = "types";
    }
    filterQuery["types"] = filterQuery["type"];
    delete filterQuery["type"];

    let offset = limit * (page - 1);

    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);
    let { data } = db;
    totalPokemons = data.length;

    let result = [];

    if (filterKeys.length) {
      filterKeys.forEach((condition) => {
        result = {
          data: data.filter((pokemon) =>
            pokemon[condition].includes(filterQuery[condition])
          ),
          totalPokemons: data.length,
        };
      });
    } else {
      result = {
        data: data,
        totalPokemons: data.length,
      };
    }

    data = result.data.slice(offset, offset + limit);
    result = {
      data: data,
      totalPokemons: data.length,
    };
    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
});

// GET DETAIL POKEMON

router.get("/:id", (req, res, next) => {
  let { params } = req;
  let pokemonId = parseInt(params.id);

  try {
    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);
    const { data } = db;

    let result = [];
    let index = data.indexOf(
      data.find((pokemon) => pokemon.id === parseInt(pokemonId))
    );
    console.log(index);
    if (index >= 0) {
      result =
        pokemonId == 1
          ? [data[data.length - 1], data[0], data[1]]
          : pokemonId == data[data.length - 1].id
          ? [data[data.length - 2], data[data.length - 1], data[0]]
          : [data[index - 1], data[index], data[index + 1]];
      const currentPokemons = {
        data: {
          previousPokemon: result[0],
          pokemon: result[1],
          nextPokemon: result[2],
        },
      };
      res.status(200).send(currentPokemons);
    } else {
      const exception = new Error(`No pokemon found`);
      exception.statusCode = 401;
      throw exception;
    }
  } catch (error) {
    next(error);
  }
});

// CREATE NEW POKEMON

router.post("/", (req, res, next) => {
  try {
    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);
    const { data } = db;
    const { name, id, types, url } = req.body;

    if (!name || !id || !types || !url) {
      const exception = new Error(`Missing required data`);
      console.log();
      exception.statusCode = 400;
      throw exception;
    }
    if (types.length > 2) {
      const exception = new Error(`No more than 2 types`);
      exception.statusCode = 400;
      throw exception;
    }
    if (!pokemonTypes.some((r) => types.indexOf(r) >= 0)) {
      const exception = new Error(`Pokémon's type is invalid`);
      exception.statusCode = 400;
      throw exception;
    }

    const pokemonNames = data.map((pokemon) => pokemon.name);
    const pokemonIds = data.map((pokemon) => pokemon.id);

    if (pokemonNames.includes(name) || pokemonIds.includes(id)) {
      const exception = new Error(`The Pokémon already exists`);
      exception.statusCode = 400;
      throw exception;
    }

    const newPokemon = {
      name,
      id: parseInt(id),
      types: types.filter((type) => type !== null),
      url,
    };

    data.push(newPokemon);
    db.data = data;
    db = JSON.stringify(db);
    fs.writeFileSync("db.json", db);

    res.status(200).send(newPokemon);
  } catch (error) {
    next(error);
  }
});

// UPDATE POKEMON

router.put("/:pokemonId", (req, res, next) => {
  try {
    const allowUpdate = ["name", "id", "types", "url", "description"];

    const { pokemonId } = req.params;

    const updates = req.body;
    const updateKeys = Object.keys(updates);

    const notAllow = updateKeys.filter((el) => !allowUpdate.includes(el));

    if (notAllow.length) {
      const exception = new Error(`Update field not allow`);
      exception.statusCode = 401;
      throw exception;
    }

    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);
    const { data } = db;

    const targetIndex = data.indexOf(
      data.find((pokemon) => pokemon.id === parseInt(pokemonId))
    );
    if (targetIndex < 0) {
      const exception = new Error(`Pokemon not found`);
      exception.statusCode = 404;
      throw exception;
    }

    const updatedPokemon = { ...db.data[targetIndex], ...updates };
    db.data[targetIndex] = updatedPokemon;

    db = JSON.stringify(db);

    fs.writeFileSync("db.json", db);

    res.status(200).send(updatedPokemon);
  } catch (error) {
    next(error);
  }
});

// DELETE POKEMON

router.delete("/:pokemonId", (req, res, next) => {
  try {
    const { pokemonId } = req.params;

    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);
    const { data } = db;

    const targetIndex = data.indexOf(
      data.find((pokemon) => pokemon.id === parseInt(pokemonId))
    );
    if (targetIndex < 0) {
      const exception = new Error(`Pokemon not found`);
      exception.statusCode = 404;
      throw exception;
    }

    db.data = data.filter((pokemon) => pokemon.id !== parseInt(pokemonId));

    db = JSON.stringify(db);

    fs.writeFileSync("db.json", db);

    res.status(200).send({});
  } catch (error) {
    next(error);
  }
});

module.exports = router;
