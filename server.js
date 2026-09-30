const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const PORT = 8080;

const PUBLIC_DIR = path.join(__dirname, 'public');
const DATABASE_FILE = path.join(__dirname, 'student.txt');


// ======================================================
// DATABASE
// ======================================================

function ensureDatabase() {
    if (!fs.existsSync(DATABASE_FILE)) {
        fs.writeFileSync(
            DATABASE_FILE,
            '',
            'utf8'
        );
    }
}




function readStudents() {
    ensureDatabase();

    const text = fs.readFileSync(
        DATABASE_FILE,
        'utf8'
    ).trim();

    if (!text) {
        return [];
    }

    try {
        return JSON.parse(text);
    } catch (error) {
        console.error('Database error:', error);
        return [];
    }
}


function writeStudents(students) {

    fs.writeFileSync(
        DATABASE_FILE,
        JSON.stringify(
            students,
            null,
            2
        ),
        'utf8'
    );
}


// ======================================================
// REGISTRATION NUMBER
// ======================================================

function generateRegistrationNumber() {

    const students = readStudents();

    const number = students.length + 1;

    return (
        'COL-' +
        new Date().getFullYear() +
        '-' +
        String(number).padStart(5, '0')
    );
}


// ======================================================
// JSON BODY
// ======================================================

function getBody(request) {

    return new Promise((resolve, reject) => {

        let body = '';

        request.on('data', chunk => {
            body += chunk.toString();
        });

        request.on('end', () => {

            try {

                resolve(
                    body ? JSON.parse(body) : {}
                );

            } catch (error) {

                reject(error);

            }

        });

        request.on('error', reject);

    });

}


// ======================================================
// SECURITY / CLEAN INPUT
// ======================================================

function clean(value) {

    if (value === undefined || value === null) {
        return '';
    }

    return String(value)
        .trim()
        .replace(/[<>]/g, '');
}


// ======================================================
// DATE
// ======================================================

function currentDate() {

    return new Date()
        .toISOString()
        .split('T')[0];

}


// ======================================================
// API - REGISTER STUDENT
// ======================================================

async function registerStudent(request, response) {

    try {

        const data = await getBody(request);

        const name = clean(data.name);
        const father = clean(data.father);
        const mobile = clean(data.mobile);
        const email = clean(data.email);
        const dob = clean(data.dob);
        const gender = clean(data.gender);
        const address = clean(data.address);
        const course = clean(data.course);


        if (
            !name ||
            !father ||
            !mobile ||
            !course
        ) {

            return sendJSON(
                response,
                400,
                {
                    success: false,
                    message: 'Required fields missing'
                }
            );

        }


        const students = readStudents();


        // Duplicate mobile check
        const duplicate = students.find(
            student =>
                student.mobile === mobile
        );


        if (duplicate) {

            return sendJSON(
                response,
                409,
                {
                    success: false,
                    message:
                        'This mobile number is already registered',
                    registrationNo:
                        duplicate.registrationNo
                }
            );

        }


        const student = {

            id: crypto.randomUUID(),

            registrationNo:
                generateRegistrationNumber(),

            name,
            father,
            mobile,
            email,
            dob,
            gender,
            address,
            course,

            status: 'Pending',

            registrationDate:
                currentDate()

        };


        students.push(student);

        writeStudents(students);


        sendJSON(
            response,
            201,
            {
                success: true,
                student
            }
        );


    } catch (error) {

        console.error(error);

        sendJSON(
            response,
            500,
            {
                success: false,
                message: 'Server error'
            }
        );

    }

}


// ======================================================
// API - GET STUDENT
// ======================================================

function getStudent(request, response, url) {

    const registrationNo =
        clean(
            url.searchParams.get(
                'registrationNo'
            )
        );


    const mobile =
        clean(
            url.searchParams.get(
                'mobile'
            )
        );


    const students = readStudents();


    const student = students.find(
        item =>

            (
                registrationNo &&
                item.registrationNo === registrationNo
            )

            ||

            (
                mobile &&
                item.mobile === mobile
            )
    );


    if (!student) {

        return sendJSON(
            response,
            404,
            {
                success: false,
                message: 'Student not found'
            }
        );

    }


    sendJSON(
        response,
        200,
        {
            success: true,
            student
        }
    );

}


// ======================================================
// API - ALL STUDENTS
// ======================================================

function getAllStudents(request, response) {

    const students = readStudents();

    sendJSON(
        response,
        200,
        {
            success: true,
            students
        }
    );

}


// ======================================================
// API - UPDATE STATUS
// ======================================================

async function updateStatus(request, response) {

    try {

        const data = await getBody(request);

        const registrationNo =
            clean(data.registrationNo);

        const status =
            clean(data.status);


        const allowedStatuses = [
            'Pending',
            'Verified',
            'Approved',
            'Rejected'
        ];


        if (
            !registrationNo ||
            !allowedStatuses.includes(status)
        ) {

            return sendJSON(
                response,
                400,
                {
                    success: false,
                    message: 'Invalid data'
                }
            );

        }


        const students = readStudents();


        const index =
            students.findIndex(
                student =>
                    student.registrationNo ===
                    registrationNo
            );


        if (index === -1) {

            return sendJSON(
                response,
                404,
                {
                    success: false,
                    message: 'Student not found'
                }
            );

        }


        students[index].status = status;

        writeStudents(students);


        sendJSON(
            response,
            200,
            {
                success: true,
                student: students[index]
            }
        );


    } catch (error) {

        sendJSON(
            response,
            500,
            {
                success: false,
                message: 'Server error'
            }
        );

    }

}


// ======================================================
// JSON RESPONSE
// ======================================================

function sendJSON(
    response,
    status,
    data
) {

    response.writeHead(
        status,
        {
            'Content-Type':
                'application/json; charset=utf-8',

            'Access-Control-Allow-Origin':
                '*'
        }
    );

    response.end(
        JSON.stringify(data)
    );

}


// ======================================================
// STATIC FILE SERVER
// ======================================================

function serveStatic(request, response) {

    let filePath =
        request.url === '/'
            ? '/index.html'
            : request.url.split('?')[0];


    filePath =
        path.normalize(filePath)
            .replace(/^(\.\.[/\\])+/, '');


    const fullPath =
        path.join(
            PUBLIC_DIR,
            filePath
        );


    if (
        !fullPath.startsWith(
            PUBLIC_DIR
        )
    ) {

        response.writeHead(403);
        response.end('Forbidden');
        return;

    }


    fs.readFile(
        fullPath,
        (error, data) => {

            if (error) {

                response.writeHead(404);
                response.end('Not Found');

                return;
            }


            const extension =
                path.extname(fullPath);


            const types = {

                '.html':
                    'text/html; charset=utf-8',

                '.css':
                    'text/css; charset=utf-8',

                '.js':
                    'text/javascript; charset=utf-8',

                '.json':
                    'application/json',

                '.png':
                    'image/png',

                '.jpg':
                    'image/jpeg',

                '.jpeg':
                    'image/jpeg',

                '.svg':
                    'image/svg+xml'

            };


            response.writeHead(
                200,
                {
                    'Content-Type':
                        types[extension] ||
                        'application/octet-stream'
                }
            );


            response.end(data);

        }
    );

}


// ======================================================
// ADMIN AUTHENTICATION
// ======================================================

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function requireAdmin(request, response) {

    if (!ADMIN_PASSWORD) {
        response.writeHead(500, {
            'Content-Type': 'text/plain; charset=utf-8'
        });
        response.end('ADMIN_PASSWORD is not configured');
        return false;
    }

    const auth = request.headers.authorization || '';

    if (!auth.startsWith('Basic ')) {
        response.writeHead(401, {
            'WWW-Authenticate': 'Basic realm="Admin Panel"',
            'Content-Type': 'text/plain; charset=utf-8'
        });
        response.end('Admin login required');
        return false;
    }

    try {
        const decoded = Buffer
            .from(auth.slice(6), 'base64')
            .toString('utf8');

        const separator = decoded.indexOf(':');
        const username = separator >= 0
            ? decoded.slice(0, separator)
            : '';
        const password = separator >= 0
            ? decoded.slice(separator + 1)
            : '';

        if (username !== 'admin' || password !== ADMIN_PASSWORD) {
            response.writeHead(401, {
                'WWW-Authenticate': 'Basic realm="Admin Panel"',
                'Content-Type': 'text/plain; charset=utf-8'
            });
            response.end('Invalid admin credentials');
            return false;
        }

        return true;

    } catch (error) {
        response.writeHead(401, {
            'WWW-Authenticate': 'Basic realm="Admin Panel"'
        });
        response.end('Invalid authorization');
        return false;
    }
}

// ======================================================
// SERVER
// ======================================================

const server =
    http.createServer(
        async (request, response) => {

            const url =
                new URL(
                    request.url,
                    `http://${request.headers.host}`
                );


            // Protect admin page and admin APIs
            const adminProtected =
                url.pathname === '/admin.html' ||
                url.pathname === '/api/students' ||
                url.pathname === '/api/status';

            if (adminProtected && !requireAdmin(request, response)) {
                return;
            }


            // CORS preflight
            if (request.method === 'OPTIONS') {

                response.writeHead(
                    204,
                    {
                        'Access-Control-Allow-Origin':
                            '*',

                        'Access-Control-Allow-Methods':
                            'GET,POST,OPTIONS',

                        'Access-Control-Allow-Headers':
                            'Content-Type'
                    }
                );

                response.end();

                return;
            }


            // Register
            if (
                request.method === 'POST' &&
                url.pathname ===
                    '/api/register'
            ) {

                return registerStudent(
                    request,
                    response
                );

            }


            // Update status
            if (
                request.method === 'POST' &&
                url.pathname ===
                    '/api/status'
            ) {

                return updateStatus(
                    request,
                    response
                );

            }


            // Get student
            if (
                request.method === 'GET' &&
                url.pathname ===
                    '/api/student'
            ) {

                return getStudent(
                    request,
                    response,
                    url
                );

            }


            // Get all
            if (
                request.method === 'GET' &&
                url.pathname ===
                    '/api/students'
            ) {

                return getAllStudents(
                    request,
                    response
                );

            }


            // Static files
            serveStatic(
                request,
                response
            );

        }
    );


// ======================================================
// START
// ======================================================

server.listen(
    PORT,
    '0.0.0.0',
    () => {

        console.log('');
        console.log(
            '================================='
        );

        console.log(
            'College Registration Server'
        );

        console.log(
            '================================='
        );

        console.log(
            `Local: http://localhost:${PORT}`
        );


        const interfaces =
            os.networkInterfaces();


        for (
            const name in interfaces
        ) {

            for (
                const net of interfaces[name]
            ) {

                if (
                    net.family === 'IPv4' &&
                    !net.internal
                ) {

                    console.log(
                        `WiFi: http://${net.address}:${PORT}`
                    );

                }

            }

        }

        console.log('');

    }
);