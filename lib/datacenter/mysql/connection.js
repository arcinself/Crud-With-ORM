const {to} = require('await-to-js');
const {Sequelize, DataTypes} = require('sequelize');

const connection = new Sequelize(
    'CRUD',
    'root',
    'Redbottle@321',
    {
        host : 'localhost',
        dialect : 'mysql'
    }
);

const coursesModel = connection.define('courses', {
    id : {
        type : DataTypes.BIGINT(11),
        autoIncrement :true,
        primaryKey : true
    },
    name : {
        type : DataTypes.STRING,
        notEmpty : true,
        notNull : true
    },
    description : {
        type : DataTypes.STRING,
        notEmpty : true,
        notNull : true
    },
    availableSlots : {
        type : DataTypes.INTEGER,
        isInt : true,
        notNull : true
    }
});

const studentsModel = connection.define('students', {
    id : {
        type : DataTypes.BIGINT(11),
        autoIncrement :true,
        primaryKey : true
    },
    username : {
        type : DataTypes.STRING,
        notEmpty : true,
        notNull : true
    },
    email : {
        type : DataTypes.STRING,
        notEmpty : true,
        notNull : true
    },
    password : {
        type : DataTypes.STRING,
        notEmpty : true,
        notNull : true
    }
});

const enrolledStudentsModel = connection.define('enrolledStudents', {
    course_id : {
        type : DataTypes.BIGINT(11),
        allowNull : false,
        references : {
            model : coursesModel,
            key : 'id'
        }
    },
    student_id : {
        type : DataTypes.BIGINT(11),
        allowNull : false,
        references : {
            model : studentsModel,
            key : 'id'
        }
    },
    studentName : {
        type : DataTypes.STRING,
        notEmpty : true,
        notNull : true
    }
});

const connect = async() => {
    let [err, result] = await to(connection.sync({alter:true}));
    if (err){
        console.log(`Error: ${err.message}`);
        return;
    }
    console.log(`Successfully connected to the database.`);
}

module.exports = {
    connect, coursesModel, enrolledStudentsModel, studentsModel
}