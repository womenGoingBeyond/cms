var addUserPoints = async function(userID) {
  const  userPoints = await strapi.db.query('plugin::users-permissions.user').findOne({
     select: ['user_points'],
     where: { id: userID }
   });
     await strapi.db.query('plugin::users-permissions.user').update({
     where: { id: userID },
     data: {
       user_points: parseInt(userPoints.user_points) + 5
     }
   })
   // ######## 
}

var addUserFlashes = async function(userID, courseFinished = false) {
  const flashs = (courseFinished)? 10 : 1
  const  userFlashes = await strapi.db.query('plugin::users-permissions.user').findOne({
     select: ['user_flashs'],
     where: { id: userID }
   });
   const  userPoints = await strapi.db.query('plugin::users-permissions.user').findOne({
     select: ['user_points'],
     where: { id: userID }
   }); 
     await strapi.db.query('plugin::users-permissions.user').update({
     where: { id: userID },
     data: {
      user_flashs: parseInt(userFlashes.user_flashs) + flashs,
      user_points: parseInt(userPoints.user_points) + (5 * flashs)
     }
   })

   // ######## 
}



var createCertificate = async function(userID, courseID) {
    await strapi.entityService.create('api::certificate.certificate', {
      data: {
        users_permissions_user: userID,
        course: courseID
      }
    })
}
 
exports.createCertificate = createCertificate;
exports.addUserPoints = addUserPoints;
exports.addUserFlashes = addUserFlashes;