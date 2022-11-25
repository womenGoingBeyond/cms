module.exports = {
    routes: [
      {
        method: 'GET',
        path: '/certificate/:userID/allCertificates',
        handler: 'certificate.getAllNestedInformation',
      }
    ],
  }
  