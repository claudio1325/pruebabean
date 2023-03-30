const express = require('express')
const controller = require('../../app/controllers/photostudent')
const router = express.Router()

router.get('/getAllInstitucion', controller.getAllInstitucion)
router.get('/getAllPhotoStudents', controller.getAllPhotoStudents)
router.get('/getAllPhotoStudents/:id', controller.getAllPhotoStudents_)
router.get('/getfilebyemplid/:id', controller.getPhotoStudentbyEmplid)
router.get('/getVisiblePhotoStudent', controller.getVisiblePhotoStudent)
router.get('/getAllVisiblePhotoStudent', controller.getAllVisiblePhotoStudent)
router.post('/addVisiblePhotoStudent', controller.addVisiblePhotoStudent)
router.post('/updVisiblePhotoStudent', controller.updVisiblePhotoStudent)
router.get('/deleteVisiblePhotoStudent/:id', controller.deleteVisiblePhotoStudent)
router.post('/exportDataStudentPhoto', controller.exportDataStudentPhoto)

module.exports = router