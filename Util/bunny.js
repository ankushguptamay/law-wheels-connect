const axios = require("axios");
const { BUNNY_HOSTNAME, BUNNY_STORAGE_ACCESS_KEY } = process.env;

exports.uploadFileToBunny = async (bunnyFolderName, fileStream, filename) => {
  return new Promise((resolve, reject) => {
    axios
      .put(`${BUNNY_HOSTNAME}/${bunnyFolderName}/${filename}`, fileStream, {
        headers: {
          AccessKey: BUNNY_STORAGE_ACCESS_KEY,
        },
      })
      .then(
        (data) => {
          resolve(data);
        },
        (error) => {
          reject(error);
        }
      );
  });
};

exports.deleteFileToBunny = async (bunnyFolderName, filename) => {
  return new Promise((resolve, reject) => {
    axios
      .delete(`${BUNNY_HOSTNAME}/${bunnyFolderName}/${filename}`, {
        headers: {
          AccessKey: BUNNY_STORAGE_ACCESS_KEY,
        },
      })
      .then(
        (data) => {
          resolve(data);
        },
        (error) => {
          reject(error);
        }
      );
  });
};

// const questionAnswer = [
//   {
//     id: 1,
//     question: "Coastal State of India?",
//     optionA: "Maharashtra",
//     optionB: "Haryana",
//     optionC: "UP",
//     optionD: "Kerala",
//     answer: ["a", "b"],
//   },
//   {
//     id: 2,
//     question: "Asian Country?",
//     optionA: "India",
//     optionB: "China",
//     optionC: "USA",
//     optionD: "Russia",
//     answer: ["a", "b"],
//   },
//   {
//     id: 3,
//     question: "Capital city of J&K?",
//     optionA: "Leh",
//     optionB: "Jammu",
//     optionC: "Kargil",
//     optionD: "Shree Nagar",
//     answer: ["b", "d"],
//   },
//   {
//     id: 4,
//     question: "City in Europe?",
//     optionA: "London",
//     optionB: "Biging",
//     optionC: "Delhi",
//     optionD: "Ankara",
//     answer: ["a"],
//   },
// ];

// const userAnswer = [
//   {
//     questionId: 1,
//     answer: ["c", "b"],
//   },
//   {
//     questionId: 3,
//     answer: ["b", "c"],
//   },
//   {
//     questionId: 4,
//     answer: ["a"],
//   },
// ];

// const result = {
//   skip: 1,
//   wrong: 2,
//   right: 1,
//   totalAttempt: 3,
// };
