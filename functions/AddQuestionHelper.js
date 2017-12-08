const functions = require("firebase-functions");
const URLSearchParams = require("url-search-params");

function toArrayList(_list) {
  var list = [];
  var newArr = JSON.parse(_list);
  var x = 0;
  for (x in newArr) {
    list[x] = newArr[x];
    x++;
  }
  return list;
}

function addQuestionHandler(
  admin,
  question_info,
  current_question_counter,
  choices
) {
  return new Promise((resolve, reject) => {
    resolve(
      question_type_handler(
        admin,
        question_info,
        current_question_counter,
        choices,
        question_info.question_type
      )
    );
  });
}

function updateCurrentQuestionCounter(admin, current_question_counter) {
  return new Promise((resolve, reject) => {
    var db = admin.database();
    db.ref("questionCounter").set({ current: current_question_counter + 1 });
    resolve();
  });
}

function question_type_handler(
  admin,
  question_info,
  current_question_counter,
  choices,
  type
) {
  return new Promise((resolve, reject) => {
    var db = admin.database();
    var new_q = db.ref(
      "Subject/" +
        question_info.subject_name +
        "/levels/" +
        question_info.level_id +
        "/Questions"
    );
    //#1 get last question id
    new_q.once("value", function(snapshot) {
      var qestion_number = snapshot.val().length;
      //# add new question
      db
        .ref(
          "Subject/" +
            question_info.subject_name +
            "/levels/" +
            question_info.level_id +
            "/Questions/" +
            qestion_number
        )
        .set({
          question: question_info.question,
          type: question_info.question_type,
          id: current_question_counter,
          choices: choices
        });

      var right_answer = db.ref("right_answer");
      right_answer.once("value", function(snapshot) {
        var right_answer_number = snapshot.val().length;
        var _correct_answers = toArrayList(question_info.correct_answers);

        if ((type == "true_false") | (type == "one_word")) {
          db.ref("right_answer/" + right_answer_number).set({
            answer_id: _correct_answers[0].iscorrect,
            question_id: current_question_counter
          });
        } else if (type == "multiple_choice") {
          var multiple_choice_correct_answers = [];
          for (var x in _correct_answers) {
            if (_correct_answers[x].iscorrect === false) {
              _correct_answers.splice(
                _correct_answers.indexOf(_correct_answers[x]),
                1
              );
            }
          }
          for (var x in _correct_answers) {
            multiple_choice_correct_answers[x] = _correct_answers[x].iscorrect;
          }
          db.ref("right_answer/" + right_answer_number).set({
            answer_id: multiple_choice_correct_answers,
            question_id: current_question_counter
          });
        }
      });
      resolve(current_question_counter);
    });
  });
}
function getCurrentQuestionCounter(admin) {
  return new Promise((resolve, reject) => {
    var db = admin.database();
    db.ref("questionCounter").once("value", function(snapshot) {
      var result = snapshot.val();
      console.log("current_value inside " + result.current);
      resolve(result.current);
    });
  });
}
module.exports.getCurrentQuestionCounter = getCurrentQuestionCounter;
module.exports.toArrayList = toArrayList;
module.exports.addQuestionHandler = addQuestionHandler;
module.exports.updateCurrentQuestionCounter = updateCurrentQuestionCounter;
module.exports.question_type_handler = question_type_handler;
