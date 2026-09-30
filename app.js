// ======================================================
// REGISTER STUDENT
// ======================================================

const form =
    document.getElementById(
        'registrationForm'
    );


if (form) {

    form.addEventListener(
        'submit',
        async function (event) {

            event.preventDefault();


            const data = {

                name:
                    document.getElementById(
                        'name'
                    ).value,

                father:
                    document.getElementById(
                        'father'
                    ).value,

                mobile:
                    document.getElementById(
                        'mobile'
                    ).value,

                email:
                    document.getElementById(
                        'email'
                    ).value,

                dob:
                    document.getElementById(
                        'dob'
                    ).value,

                gender:
                    document.getElementById(
                        'gender'
                    ).value,

                course:
                    document.getElementById(
                        'course'
                    ).value,

                address:
                    document.getElementById(
                        'address'
                    ).value

            };


            const message =
                document.getElementById(
                    'message'
                );


            message.innerHTML =
                'Saving...';


            try {

                const response =
                    await fetch(
                        '/api/register',
                        {

                            method: 'POST',

                            headers: {
                                'Content-Type':
                                    'application/json'
                            },

                            body:
                                JSON.stringify(data)

                        }
                    );


                const result =
                    await response.json();


                if (!result.success) {

                    message.innerHTML =
                        `<div class="error">
                            ${result.message}
                        </div>`;

                    return;
                }


                const student =
                    result.student;


                message.innerHTML = `

                    <div class="success">

                        <h2>
                            Registration Successful
                        </h2>

                        <p>
                            Registration No:
                            <strong>
                                ${student.registrationNo}
                            </strong>
                        </p>

                        <p>
                            Name:
                            ${student.name}
                        </p>

                        <p>
                            Status:
                            ${student.status}
                        </p>

                        <a
                            class="btn"
                            href="receipt.html?registrationNo=${encodeURIComponent(
                                student.registrationNo
                            )}"
                        >
                            View Receipt
                        </a>

                    </div>

                `;


                form.reset();


            } catch (error) {

                message.innerHTML =
                    `<div class="error">
                        Server से connection नहीं है।
                    </div>`;

            }

        }
    );

}


// ======================================================
// FIND STUDENT
// ======================================================

async function findStudent() {

    const input =
        document.getElementById(
            'registrationNo'
        );


    const resultBox =
        document.getElementById(
            'result'
        );


    if (!input || !resultBox) {
        return;
    }


    const registrationNo =
        input.value.trim();


    if (!registrationNo) {

        resultBox.innerHTML =
            '<div class="error">Registration number डालें।</div>';

        return;
    }


    resultBox.innerHTML =
        'Searching...';


    try {

        const response =
            await fetch(
                `/api/student?registrationNo=${encodeURIComponent(
                    registrationNo
                )}`
            );


        const result =
            await response.json();


        if (!result.success) {

            resultBox.innerHTML =
                `<div class="error">
                    Student नहीं मिला।
                </div>`;

            return;
        }


        const student =
            result.student;


        resultBox.innerHTML = `

            <div class="student-card">

                <h2>
                    ${student.name}
                </h2>

                <p>
                    Registration No:
                    <strong>
                        ${student.registrationNo}
                    </strong>
                </p>

                <p>
                    Father's Name:
                    ${student.father}
                </p>

                <p>
                    Course:
                    ${student.course}
                </p>

                <p>
                    Registration Date:
                    ${student.registrationDate}
                </p>

                <div class="status">
                    ${student.status}
                </div>

                <a
                    class="btn"
                    href="receipt.html?registrationNo=${encodeURIComponent(
                        student.registrationNo
                    )}"
                >
                    View Receipt
                </a>

            </div>

        `;


    } catch (error) {

        resultBox.innerHTML =
            `<div class="error">
                Server से connection नहीं है।
            </div>`;

    }

}


// ======================================================
// ADMIN - LOAD STUDENTS
// ======================================================

async function loadStudents() {

    const box =
        document.getElementById(
            'studentList'
        );


    if (!box) {
        return;
    }


    box.innerHTML =
        'Loading...';


    try {

        const response =
            await fetch(
                '/api/students'
            );


        const result =
            await response.json();


        if (!result.success) {

            box.innerHTML =
                'Unable to load students';

            return;
        }


        const students =
            result.students;


        if (!students.length) {

            box.innerHTML =
                '<p>No students registered.</p>';

            return;
        }


        let html = `

            <table>

                <thead>

                    <tr>

                        <th>Registration</th>

                        <th>Name</th>

                        <th>Mobile</th>

                        <th>Course</th>

                        <th>Status</th>

                        <th>Action</th>

                    </tr>

                </thead>

                <tbody>

        `;


        students.forEach(
            student => {

                html += `

                    <tr>

                        <td>
                            ${student.registrationNo}
                        </td>

                        <td>
                            ${student.name}
                        </td>

                        <td>
                            ${student.mobile}
                        </td>

                        <td>
                            ${student.course}
                        </td>

                        <td>

                            <select
                                onchange="changeStatus(
                                    '${student.registrationNo}',
                                    this.value
                                )"
                            >

                                <option
                                    ${student.status === 'Pending'
                                        ? 'selected'
                                        : ''}
                                >
                                    Pending
                                </option>

                                <option
                                    ${student.status === 'Verified'
                                        ? 'selected'
                                        : ''}
                                >
                                    Verified
                                </option>

                                <option
                                    ${student.status === 'Approved'
                                        ? 'selected'
                                        : ''}
                                >
                                    Approved
                                </option>

                                <option
                                    ${student.status === 'Rejected'
                                        ? 'selected'
                                        : ''}
                                >
                                    Rejected
                                </option>

                            </select>

                        </td>

                        <td>

                            <a
                                href="receipt.html?registrationNo=${encodeURIComponent(
                                    student.registrationNo
                                )}"
                            >
                                Receipt
                            </a>

                        </td>

                    </tr>

                `;

            }
        );


        html += `

                </tbody>

            </table>

        `;


        box.innerHTML = html;


    } catch (error) {

        box.innerHTML =
            `<div class="error">
                Server से connection नहीं है।
            </div>`;

    }

}


// ======================================================
// CHANGE STATUS
// ======================================================

async function changeStatus(
    registrationNo,
    status
) {

    try {

        const response =
            await fetch(
                '/api/status',
                {

                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({

                            registrationNo,
                            status

                        })

                }
            );


        const result =
            await response.json();


        if (!result.success) {

            alert(
                'Status update failed'
            );

            return;
        }


        alert(
            'Status updated successfully'
        );


    } catch (error) {

        alert(
            'Server connection error'
        );

    }

}


// ======================================================
// RECEIPT
// ======================================================

async function loadReceipt() {

    const box =
        document.getElementById(
            'receipt'
        );


    if (!box) {
        return;
    }


    const params =
        new URLSearchParams(
            window.location.search
        );


    const registrationNo =
        params.get(
            'registrationNo'
        );


    if (!registrationNo) {

        box.innerHTML =
            '<div class="error">Registration number missing.</div>';

        return;
    }


    try {

        const response =
            await fetch(
                `/api/student?registrationNo=${encodeURIComponent(
                    registrationNo
                )}`
            );


        const result =
            await response.json();


        if (!result.success) {

            box.innerHTML =
                '<div class="error">Student not found.</div>';

            return;
        }


        const student =
            result.student;


        box.innerHTML = `

            <div class="receipt">

                <h1>
                    COLLEGE REGISTRATION
                </h1>

                <h3>
                    STUDENT REGISTRATION RECEIPT
                </h3>

                <hr>


                <div class="receipt-row">

                    <strong>
                        Registration No:
                    </strong>

                    <span>
                        ${student.registrationNo}
                    </span>

                </div>


                <div class="receipt-row">

                    <strong>
                        Student Name:
                    </strong>

                    <span>
                        ${student.name}
                    </span>

                </div>


                <div class="receipt-row">

                    <strong>
                        Father's Name:
                    </strong>

                    <span>
                        ${student.father}
                    </span>

                </div>


                <div class="receipt-row">

                    <strong>
                        Mobile:
                    </strong>

                    <span>
                        ${student.mobile}
                    </span>

                </div>


                <div class="receipt-row">

                    <strong>
                        Email:
                    </strong>

                    <span>
                        ${student.email || '-'}
                    </span>

                </div>


                <div class="receipt-row">

                    <strong>
                        Date of Birth:
                    </strong>

                    <span>
                        ${student.dob || '-'}
                    </span>

                </div>


                <div class="receipt-row">

                    <strong>
                        Gender:
                    </strong>

                    <span>
                        ${student.gender || '-'}
                    </span>

                </div>


                <div class="receipt-row">

                    <strong>
                        Course:
                    </strong>

                    <span>
                        ${student.course}
                    </span>

                </div>


                <div class="receipt-row">

                    <strong>
                        Address:
                    </strong>

                    <span>
                        ${student.address || '-'}
                    </span>

                </div>


                <div class="receipt-row">

                    <strong>
                        Registration Date:
                    </strong>

                    <span>
                        ${student.registrationDate}
                    </span>

                </div>


                <div class="receipt-status">

                    Status:
                    ${student.status}

                </div>


                <div class="signature">

                    Authorized Signature

                </div>

            </div>

        `;


    } catch (error) {

        box.innerHTML =
            '<div class="error">Unable to load receipt.</div>';

    }

}