// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require("firebase-functions");
const URLSearchParams = require("url-search-params");

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
var db = admin.database();
const auto_correct = db.ref("/auto_correct");
var ref = db.ref("Questions");
var {
  toArrayList,
  addQuestionHandler,
  updateCurrentQuestionCounter,
  getCurrentQuestionCounter
} = require("./AddQuestionHelper");

function compare(firstArray, secondArray) {
  if (firstArray.length != secondArray.length) return false;
  for (var i = 0; i < secondArray.length; i++) {
    if (firstArray[i].compare) {
      //To test values in nested arrays
      if (!firstArray[i].compare(secondArray[i])) return false;
    } else if (firstArray[i] !== secondArray[i]) return false;
  }
  return true;
}

exports.addQuestion = functions.https.onRequest((req, res) => {
  var _cr_question = {
    subject_name: req.body.subject_name,
    level_id: req.body.level_id,
    question: req.body.question,
    question_type: req.body.question_type,
    choices: req.body.choices,
    correct_answers: req.body.correct_answers
  };
  getCurrentQuestionCounter(admin)
    .then(counter =>
      addQuestionHandler(admin,
        _cr_question,
        counter,
        toArrayList(_cr_question.choices)
      )
    )
    .then(counter => updateCurrentQuestionCounter(admin,counter))
    .then(result => res.send({ success: "true" }));
});

exports.correctAnswer = functions.https.onRequest((req, res) => {
  var db = admin.database();
  var right_answer_table = db.ref("right_answer");

  var student_answer = {
    question_id: req.body.question_id,
    answer_id: req.body.answer_id,
    student_id: req.body.student_id,
    type: req.body.question_type
  };
  console.log("from student " + student_answer);

  var auto_correct_table = db.ref("auto_correct_" + student_answer.student_id);

  right_answer_table.on(
    "value",
    function(snapshot) {
      var result = {
        question_id: student_answer.question_id,
        student_answer: student_answer.answer_id,
        result: false,
        correctAnswer_id: answer_id,
        success: false
      };
      console.log(snapshot.val());
      console.log(snapshot.val().length);

      for (var x in snapshot.val()) {
        var { answer_id, question_id } = snapshot.val()[x];

        if (student_answer.question_id == question_id) {
          if (student_answer.type == "multiple_choice") {
            var final_result = false;
            var correctAnswerCounter = 0;
            var corect_answer_array = answer_id[1];
            var student_answer_array = student_answer.answer_id
              .toString()
              .substr(1)
              .slice(0, -1)
              .split(",");
            if (corect_answer_array.length == student_answer_array.length) {
              for (var x in corect_answer_array) {
                for (var y in student_answer_array) {
                  if (student_answer_array[y] == corect_answer_array[x]) {
                    correctAnswerCounter++;
                  }
                }
              }
            }
            if (correctAnswerCounter == corect_answer_array.length) {
              final_result = true;
            }
            result = {
              question_id: student_answer.question_id,
              result: final_result,
              student_answer: student_answer.answer_id,
              correctAnswer_id: corect_answer_array,
              success: true
            };
          } else if (student_answer.answer_id == answer_id) {
            result = {
              question_id: student_answer.question_id,
              result: true,
              student_answer: student_answer.answer_id,
              correctAnswer_id: answer_id,
              success: true
            };
            console.log("student has a correctAnswer");
          } else {
            result = {
              question_id: student_answer.question_id,
              student_answer: student_answer.answer_id,
              result: false,
              correctAnswer_id: answer_id,
              success: true
            };

            console.log("student has a wrong answer");
          }
        }
      }
      auto_correct_table.child(student_answer.question_id).set(result);
      res.send(result);
    },
    function(errorObject) {
      console.log("The read failed: " + errorObject.code);
    }
  );
});
exports.getSubjects = functions.https.onRequest((req, res) => {
  var db = admin.database();
  var subjects_table = db.ref("Subject");
  subjects_table.on(
    "value",
    function(snapshot) {
      res.send(snapshot.val());
    },
    function(errorObject) {
      console.log("The read failed: " + errorObject.code);
    }
  );
});
exports.getAchievements = functions.https.onRequest((req, res) => {
  var db = admin.database();
  console.log("Achievements/" + req.body.student_id);
  var Achievements = db.ref("Achievements/" + req.body.student_id);
  Achievements.on("value", function(snapshot) {
    res.send(snapshot.val());
  });
});
exports.checkIfTeacher = functions.https.onRequest((req, res) => {
  var teacherInfo = {
    email: req.body.email,
    password: req.body.password
  };
  var result = {
    auth: false,
    isTeacher: false,
    subjects: []
  };

  console.log(teacherInfo.email + "  " + teacherInfo.password);
  var db = admin.database();
  var My_lecturer = db.ref("My_lecturer");
  My_lecturer.on("value", function(snapshot) {
    for (var x in snapshot.val()) {
      var { email, password, subjects, id, name } = snapshot.val()[x];
      if (teacherInfo.email == email) {
        // the right email
        result = {
          auth: false,
          isTeacher: true,
          t_subjects: subjects,
          t_name: name,
          t_id: id
        };
        if (teacherInfo.password == password) {
          // correct password
          result = {
            auth: true,
            isTeacher: true,
            t_subjects: subjects,
            t_name: name,
            t_id: id
          };
        }
      }
    }
    res.send(result);
  });
});
exports.setNewAchievements = functions.https.onRequest((req, res) => {
  var db = admin.database();
  console.log("Achievements/" + req.body.student_id);
  var Achievements = db.ref("Achievements/" + req.body.student_id);
  var Achievements_counter = 0;
  Achievements.on("value", function(snapshot) {
    Achievements_counter = snapshot.val().length;
  });

  var Achievements_child = db.ref(
    "Achievements/" + req.body.student_id + "/" + Achievements_counter
  );
  Achievements_child.set({
    level: req.body.level,
    strike_time: req.body.striketime,
    subject: req.body.subject
  });

  res.send({ success: true });
});
