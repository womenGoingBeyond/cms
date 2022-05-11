module.exports = {
  async afterUpdate(event) {
    let quizState = await strapi.entityService.findOne('api::user-quiz-progress.user-quiz-progress', event.result.id, {
      populate: {
        quiz: {
          fields: ['id']
        },
        users_permissions_user: {
          fields: ['id']
        }
      }
    })
    await setLessonState({ quizId: quizState.quiz.id, userId: quizState.users_permissions_user.id })
  },

  async afterCreate(event) {
    await setLessonState({ quizId: +event.params.data.quiz, userId: event.params.data.users_permissions_user })
  }
}


async function setLessonState({ quizId, userId }) {
  let allCourseSteps, completedCourseSteps = 0

  // get all questions
  let quiz = await strapi.entityService.findOne('api::quiz.quiz', quizId, {
    fields: ['id'],
    populate: {
      lesson: {
        fields: ['id'],
        populate: {
          fields: ['id'],
          quizzes: {
            fields: ['id'],
            populate: {
              questions: {
                fields: ['id']
              }
            }
          },
          topics: {
            fields: ['id']
          },
          course: {
            fields: ['id']
          }
        }
      }
    }
  })

  let allQuestionIds = []
  for (let q of quiz.lesson.quizzes) {
    for (let question of q.questions) {
      allQuestionIds.push(question.id)
    }
  }
  allCourseSteps = allQuestionIds.length

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

  let allQuizzesDone = false
  for (let questionState of questionStates) {
    allQuizzesDone = questionState.state
    if (questionState.state) {
      completedCourseSteps++
    }
  }

  let topicStates = await Promise.all(quiz.lesson.topics.map(topic => {
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
  let allTopicsDone = false
  for (let state of topicStates) {
    allTopicsDone = state.length > 0 && state[0].done
    if (state.length > 0 && state[0].done) {
      completedCourseSteps++
    }
  }

  // check if entry already exists
  let entry = await strapi.entityService.findMany('api::user-lesson-state.user-lesson-state', {
    filters: {
      $and: [
        { users_permissions_user: userId },
        { lesson: quiz.lesson.id }
      ]
    },
    limit: 1
  })

  if (entry.length > 0) {
    await strapi.entityService.update('api::user-lesson-state.user-lesson-state', entry[0].id, {
      data: {
        done: allTopicsDone && allQuizzesDone
      }
    })
  } else {
    await strapi.entityService.create('api::user-lesson-state.user-lesson-state', {
      data: {
        users_permissions_user: userId,
        lesson: quiz.lesson.id,
        done: allTopicsDone && allQuizzesDone
      }
    })
  }

  let courseProgress = await strapi.entityService.findMany('api::user-course-progress.user-course-progress', {
    filters: {
      $and: [
        { users_permissions_user: userId },
        { course: quiz.lesson.course.id }
      ]
    },
    limit: 1
  })

  await strapi.entityService.update('api::user-course-progress.user-course-progress', courseProgress[0].id, {
    data: {
      progress: completedCourseSteps / allCourseSteps
    }
  })
}
