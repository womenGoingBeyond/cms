module.exports = {
  async afterUpdate(event) {
    let topicState = await strapi.entityService.findOne('api::user-topic-state.user-topic-state', event.result.id, {
      populate: {
        topic: {
          fields: ['id']
        },
        users_permissions_user: {
          fields: ['id']
        }
      }
    })
    await setLessonState({ topicId: topicState.topic.id, userId: topicState.users_permissions_user.id })
  },

  async afterCreate(event) {
    await setLessonState({ topicId: +event.params.data.topic, userId: event.params.data.users_permissions_user })
  }
}


async function setLessonState({ topicId, userId }) {
  var addUserPoints = require('../../../../util/Utils.js').addUserPoints;
  var addUserFlashes = require('../../../../util/Utils.js').addUserFlashes;
  let allCourseSteps = 0, completedCourseSteps = 0


  //Get the completed topic
  let topic = await strapi.entityService.findOne('api::topic.topic', topicId, {
    populate: {
      lesson: {
        fields: ['id']
      }
    }
  })

  //Get the corresponding lesson to the topic 
  let lesson = await strapi.entityService.findOne('api::lesson.lesson', topic.lesson.id, {
    populate: {
      course: {
        fields: ['id']
      },
      topics: {
        fields: ['id']
      },
      quizzes: {
        fields: ['id'],
        populate: {
          questions: {
            fields: ['id']
          }
        }
      }
    }
  })
  
  //Get every lesson in the database
  let allLessons = await strapi.entityService.findMany('api::lesson.lesson', {
    populate: {
      course: {
        fields: ['id']
      },
      topics: {
        fields: ['id']
      },
      quizzes: {
        fields: ['id'],
        populate: {
          questions: {
            fields: ['id']
          }
        }
      }
    }
  })

  
  const allLessonsFromCourse =   allLessons.filter(oneLesson => oneLesson.course.id == lesson.course.id);
  

  allCourseSteps = 0
  for (const singleLesson of allLessonsFromCourse) { 

        let allQuestionIds = []
        for (let q of singleLesson.quizzes) {
          for (let question of q.questions) {
            allQuestionIds.push(question.id)
          }
        }
        allCourseSteps += allQuestionIds.length

        let questionStates = (await Promise.all(allQuestionIds.map(questionId => {
          return strapi.entityService.findMany('api::user-question-state.user-question-state', {
            filters: {
              $and: [
                { users_permissions_user: userId },
                { question: questionId }
              ]
            },
            fields: ['id', 'state'],
            limit: 1
          })
        }))).flat()

        let allQuizzesDone = []
        for (let questionState of questionStates) {
          allQuizzesDone.push(questionState.state)
          if (questionState.state) {
            completedCourseSteps++
          }
        }

        let topicStates = await Promise.all(singleLesson.topics.map(topic => {
          return strapi.entityService.findMany('api::user-topic-state.user-topic-state', {
            filters: {
              $and: [
                { users_permissions_user: userId },
                { topic: topic.id }
              ]
            },
            limit: 1
          })
        }))

        allCourseSteps += topicStates.length
        let allTopicsDone = []
        for (let state of topicStates) {
          allTopicsDone.push(state.length > 0 && state[0].done)
          if (state.length > 0 && state[0].done) {
            completedCourseSteps++
          }
        }

        // check if entry already exists
        let entry = await strapi.entityService.findMany('api::user-lesson-state.user-lesson-state', {
          filters: {
            $and: [
              { users_permissions_user: userId },
              { lesson: singleLesson.id }
            ]
          },
          limit: 1
        })

        if (entry.length > 0) {
          await strapi.entityService.update('api::user-lesson-state.user-lesson-state', entry[0].id, {
            data: {
              done: allTopicsDone.every(Boolean) && allQuizzesDone.every(Boolean) &&  (topicStates.length == allTopicsDone.length ) && (allQuestionIds.length == allQuizzesDone.length )
            }
          })
        } else {
          await strapi.entityService.create('api::user-lesson-state.user-lesson-state', {
            data: {
              users_permissions_user: userId,
              lesson: singleLesson.id,
              done: allTopicsDone.every(Boolean) && allQuizzesDone.every(Boolean) && (topicStates.length == allTopicsDone.length ) && (allQuestionIds.length == allQuizzesDone.length )
            }
          })
        }

        if(allTopicsDone.every(Boolean) && allQuizzesDone.every(Boolean) &&  (topicStates.length == allTopicsDone.length ) && (allQuestionIds.length == allQuizzesDone.length )){
          // SAVE USER POINTS
          addUserFlashes(userId);
          // ########
        }
  }

  //Get all user-progress
  let getUserCourseProgress = await strapi.entityService.findMany('api::user-course-progress.user-course-progress', {
    populate: {
      course: {
        fields: ['id']
      },
    }
  })

  //Filter the courseProgressList by the relevant course
  const courseProgressToUpdate =  getUserCourseProgress.filter(oneCourseProgress => oneCourseProgress.course.id == lesson.course.id);


  //Update the courseProgress
  await strapi.entityService.update('api::user-course-progress.user-course-progress', courseProgressToUpdate[0].id, {
    data: {
      progress: completedCourseSteps,
      maxCourseProgress: allCourseSteps
    }
  })

  if(completedCourseSteps == allCourseSteps){
    console.log("#####", completedCourseSteps)
    console.log("#####", allCourseSteps)
      // SAVE USER POINTS
      addUserPoints(userId);
      addUserFlashes(userId, true);
      // ########
  }
}
