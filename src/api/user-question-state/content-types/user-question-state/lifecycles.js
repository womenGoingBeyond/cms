module.exports = {
  async afterUpdate(event) {
    let questionState = await strapi.entityService.findOne('api::user-question-state.user-question-state', event.result.id, {
      populate: {
        question: {
          fields: ['id']
        },
        users_permissions_user: {
          fields: ['id']
        }
      }
    })
    await setQuizProgress({ questionId: questionState.question.id, userId: questionState.users_permissions_user.id })
  },

  async afterCreate(event) {
    await setQuizProgress({ questionId: +event.params.data.question, userId: event.params.data.users_permissions_user })
  }
}

async function setQuizProgress({ questionId, userId }) {
  let question = await strapi.entityService.findOne('api::question.question', questionId, {
    populate: {
      quiz: {
        fields: ['id'],
        populate: {
          questions: {
            fields: ['id'],
          }
        }
      }
    }
  })

  let questionStates = await Promise.all(question.quiz.questions.map(question => {
    return strapi.entityService.findMany('api::user-question-state.user-question-state', {
      filters: {
        $and: [
          { users_permissions_user: userId },
          { question: question.id }
        ]
      },
      limit: 1
    })
  }))

  let countCompletedQuestions = 0
  for (let state of questionStates) {
    if (state.length > 0 && state[0].state) {
      countCompletedQuestions++
    }
  }

  // check if entry already exists
  let entry = await strapi.entityService.findMany('api::user-quiz-progress.user-quiz-progress', {
    filters: {
      $and: [
        { users_permissions_user: userId },
        { quiz: question.quiz.id }
      ]
    },
    limit: 1
  })

  if (entry.length > 0) {
    await strapi.entityService.update('api::user-quiz-progress.user-quiz-progress', entry[0].id, {
      data: {
        progress: +((countCompletedQuestions / questionStates.length).toFixed(2))
      }
    })
  } else {
    await strapi.entityService.create('api::user-quiz-progress.user-quiz-progress', {
      data: {
        users_permissions_user: userId,
        quiz: question.quiz.id,
        progress: +((countCompletedQuestions / questionStates.length).toFixed(2))
      }
    })
  }
}
