export default [
  { title: 'First Name', key: 'firstName' },
  { title: 'Last Name', key: 'lastName' },
  { title: 'Title', key: 'title' },
  { title: 'Job Title', key: 'jobTitleId', type: 'select', multiple: false },
  { title: 'Username', key: 'username' },
  { title: 'Email', key: 'email' },
  { title: 'Ennis ID', key: 'ennisId' },
  { title: 'Extension', key: 'extension' },
  { title: 'Hire Date', type: 'date', key: 'hireDate' },
  { title: 'Exempt', key: 'exempt', type: 'checkbox' },
  { title: 'Roles', key: 'roles', type: 'select', multiple: true, placeholder: 'Select role(s)' },
  { title: 'Status', key: 'status', type: 'select', multiple: false, placeholder: 'Status' },
]