const fs = require("fs");
const path = require("path");
const { USER_DATA_FILE } = require("../config");

const filePath = path.join(__dirname, "..", USER_DATA_FILE);

exports.loadUserData = () => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
};

exports.saveUserData = (userData) => {
  fs.writeFileSync(filePath, JSON.stringify(userData, null, 2));
};
