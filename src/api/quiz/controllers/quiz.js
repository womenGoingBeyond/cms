'use strict'

/**
 *  quiz controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::quiz.quiz', ({ strapi }) => ({
  async findOne(ctx) {
    let { data } = await super.findOne(ctx)

    // remove state (solution) from response
    let requestURL = new URL(`${ctx.request.host}${ctx.request.url}`)
    if (requestURL.search.includes('answers')) {
      for (let question of data.attributes.questions.data) {
        for (let answer of question.attributes.answers) {
          delete answer.state
        }
      }
    }

    return data
  },

  async findMany(ctx) {
    let { data } = await super.findMany(ctx)

    // remove state (solution) from response
    let requestURL = new URL(`${ctx.request.host}${ctx.request.url}`)
    if (requestURL.search.includes('answers')) {
      for (let question of data.attributes.questions.data) {
        for (let answer of question.attributes.answers) {
          delete answer.state
        }
      }
    }

    return data
  },

  async findManyQuestions(ctx) {
    let quiz = await strapi.entityService.findOne('api::quiz.quiz', ctx.params.id, {
      fields: ['id', 'title'],
      populate: {
        questions: {
          fields: ['id'],
        }
      }
    })

    let promises = []
    for (let question of quiz.questions) {
      let promise = strapi.entityService.findMany('api::user-question-state.user-question-state', {
        filters: {
          $and: [
            { users_permissions_user: ctx.state.user.id },
            { question: question.id }
          ]
        },
        populate: {
          question: { fields: ['id'] }
        },
        limit: 1
      })
      promises.push(promise)
    }
    let questionsState = (await Promise.all(promises)).flat()

    for (let question of quiz.questions) {
      if (questionsState.length === 0) {
        question.state = false
      } else {
        for (let questionState of questionsState) {
          if (question.id === questionState.question.id) {
            question.state = questionState.state
          }
        }
      }
    }

    return {
      data: quiz
    }
  },

  async findOneQuestion(ctx) {
    let questionPromise = strapi.entityService.findOne('api::question.question', ctx.params.questionId, {
      fields: ['id', 'question', 'type'],
      populate: {
        answers: {
          fields: ['id', 'content']
        }
      }
    })

    let QuestionStatePromise = strapi.entityService.findMany('api::user-question-state.user-question-state', {
      filters: {
        $and: [
          { users_permissions_user: ctx.state.user.id },
          { question: ctx.params.questionId }
        ]
      },
      limit: 1
    })

    let [question, questionState] = await Promise.all([questionPromise, QuestionStatePromise])
    question.state = questionState.length > 0 ? questionState[0].state : false
    question.provided_answer_ids = questionState.length > 0 ? questionState[0].provided_answer_ids : []

    return question
  },

  async validateSolution(ctx) {
    let questionPromise = strapi.entityService.findOne('api::question.question', ctx.params.questionId, {
      populate: {
        answers: true
      }
    })
    let userQuestionStatePromise = strapi.entityService.findMany('api::user-question-state.user-question-state', {
      filters: {
        $and: [
          { users_permissions_user: ctx.state.user.id },
          { question: ctx.params.questionId }
        ]
      },
      limit: 1
    })
    let [question, userQuestionState] = await Promise.all([questionPromise, userQuestionStatePromise])

    let providedAnswerIds = ctx.request.body['answer_ids']
    let check = question.answers.filter(answer => answer.state && providedAnswerIds.includes(answer.id))
    let isProvidedAnswerCorrect = false

    if (check.length > 0) {
      // providedAnswerIds.length === 1 ignores the brute forcing the solution
      if (question.type === 'single' && check.length === 1 && providedAnswerIds.length === 1) {
        isProvidedAnswerCorrect = true
      }
      if (question.type === 'multiple' && check.length > 1) {
        isProvidedAnswerCorrect = true
      }
    }

    // create or update the user-question-state
    let entry = null
    if (userQuestionState.length === 0) {
      entry = await strapi.entityService.create('api::user-question-state.user-question-state', {
        fields: ['id', 'provided_answer_ids', 'state', 'points'],
        data: {
          users_permissions_user: ctx.state.user.id,
          question: ctx.params.questionId,
          provided_answer_ids: providedAnswerIds,
          state: isProvidedAnswerCorrect,
          points: isProvidedAnswerCorrect ? question.points : 0
        }
      })
    } else {
      entry = await strapi.entityService.update('api::user-question-state.user-question-state', userQuestionState[0].id, {
        fields: ['id', 'provided_answer_ids', 'state', 'points'],
        data: {
          provided_answer_ids: providedAnswerIds,
          state: isProvidedAnswerCorrect,
          points: isProvidedAnswerCorrect ? question.points : 0
        }
      })
    }

    return {
      data: entry
    }
  },

  async getProgress(ctx) {
    return strapi.entityService.findMany('api::user-quiz-progress.user-quiz-progress', {
      filters: {
        $and: [
          { users_permissions_user: ctx.state.user.id },
          { quiz: ctx.params.id }
        ]
      },
      fields: ['id', 'progress'],
      populate: {
        quiz: {
          fields: ['id']
        }
      }
    })
  }
}))
