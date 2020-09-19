const express = require('express');
const router = express.Router();
const {to} = require('await-to-js')
const {checkToken} = require('./../middlewares/index');
const mysql = require('./../lib/datacenter/mysql/connection');

router.get('/', async(req, res, next) => {
    let [err, result] = await to(mysql.coursesModel.findAll());

    if(result.length < 1){
        return res.json({
            err : "No course to display."
        });
    }

    return res.json({
        data : result,
        err : null
    });
});

router.get('/:id', checkToken, async(req,res)=>{
    let courseId = req.params.id;

    let [err, result] = await to(mysql.coursesModel.findAll({
        where:{
            id : courseId
        }
    })
    );

    if(result.length === 0){
        return res.json({
            err: ` No course exists with ID ${courseId}.`
        });
    }

    if (err){
        return res.json({
            err: `Error finding course with ID ${courseId}`
        })
    }

    let data = result[0];

    [err, result] = await to(mysql.enrolledStudentsModel.findAll({
        where : {
            course_id: courseId
        }
    })
    );

    if (err){
        return res.json({
            err : `Error finding enrolled students in course with ID ${courseId}`
        });
    }

    data.dataValues.enrolledStudents = result;

    res.json({
        data : data
    });
});

router.post('/', checkToken, async(req, res) => {
    const {name, description, availableSlots} = req.body;

    if(!name || !description || !availableSlots || availableSlots<=0){
        return res.json({
            err : "Invalid payload."
        });
    }

    let [err, result] = await to(mysql.coursesModel.findAll());

    const newId = result.length+1;

    [err, result] = await to (mysql.coursesModel.create({
        id : newId,
        name : name,
        description : description,
        availableSlots : availableSlots
    })
    );

    if(err) {
        return res.json({
            err : "Error while adding course."
        });
    }

    return res.json({
        data : "Course successfully added."
    });
});

router.post('/:id/enroll', checkToken, async(req,res) => {
    const courseId =req.params.id;
    const studentId = req.body.id;

    if(!studentId){
        return res.json({
            err : "Invalid payload."
        });
    }

    let [err,result] = await to(mysql.coursesModel.findAll({
        where : {
            id : courseId
        }
    })
    );

    if(result.length === 0){
        return res.json({
            err: ` No course exists with ID ${courseId}.`
        });
    }

    let slots = result[0].availableSlots;

    [err,result] = await to(mysql.studentsModel.findAll({
        where : {
            id : studentId
        }
    })
    );

    if(result.length === 0){
        return res.json({
            err: ` No student exists with ID ${studentId}.`
        });
    }

    const student = result[0];

    [err, result] = await to(mysql.enrolledStudentsModel.findAll({
        where : {
            course_id : courseId,
            student_id : studentId
        }
    })
    );

    if(err){
        return res.json({
            err : "Error while enrolllet slots = result[0].availableSlots;ing the student."
        });
    }
    else if(result.length !== 0){
        return res.json({
            err :  "Student already enrolled in the course."
        });
    }
    else if(slots <= 0){
        return res.json({
            err : "No slots are available."
        });
    }
    else{
        [err, result] = await to(mysql.enrolledStudentsModel.create({
            course_id : courseId,
            student_id : studentId,
            studentName : student.username
        })
        );
        if(!err){
            await to(mysql.coursesModel.update(
                {
                    availableSlots: slots-1
                },
                {
                    where : { id : courseId }
                }
            ));
            return res.json({
                data : "Student enrolled successfully to the course."
            });
        }
    }
});

router.put('/:id/deregister',checkToken, async(req,res) => {

    const courseId = req.params.id;
    const studentId = req.body.id;

    if (!studentId) {
        return res.json({
            err: "Invalid payload."
        });
    }

    let [err, result] = await to(mysql.coursesModel.findAll({
        where : {
            id : courseId
        }
        })
    );

    if (result.length === 0) {
        return res.json({
            err: ` No course exists with ID ${courseId}.`
        });
    }

    let slots = result[0].availableSlots;

    [err, result] = await to(mysql.studentsModel.findAll({
        where : {
            id : studentId
        }
        })
    );

    if (result.length === 0) {
        return res.json({
            err: ` No student exists with ID ${studentId}.`
        });
    }

    [err, result] = await to(mysql.enrolledStudentsModel.findAll({
            where : {
                course_id : courseId,
                student_id : studentId
            }
        })
    );

    if (err) {
        return res.json({
            err: "Error while de-registering the student."
        });
    } else if (result.length === 0) {
        return res.json({
            err: "Student needs to be registered first."
        });
    } else {
        [err, result] = await to(mysql.enrolledStudentsModel.destroy({
                where : {
                    course_id : courseId,
                    student_id: studentId
                }
            })
        );
        if (!err) {
            mysql.coursesModel.update(
                {
                    availableSlots: slots+1
                },
                {
                    where : { id : courseId }
                }
            );
            return res.json({
                data: "Student de-registered successfully from the course."
            });
        }
    }
});


router.delete('/:id' ,checkToken, async(req, res) => {
    let courseId = req.params.id;

    let[err, result] = await to(mysql.coursesModel.destroy({
        where : {
            id : courseId
        }
    })
    );

    if (err){
        return res.json({
            err : "Error while deleting the course."
        });
    }

    if (result.affectedRows === 0){
        return res.json({
            err : `No Course with ID ${courseId}`
        });
    }

    [error, result] = await to(mysql.enrolledStudentsModel.destroy({
        where : {
            course_id : courseId
        }
    })
    );

    if (error) {
        return res.json({
            err : "Error."
        });
    }

    return res.json({
        data : "Course deleted successfully."
    });
});

module.exports = router;


