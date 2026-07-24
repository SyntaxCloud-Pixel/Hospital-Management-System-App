import { Link } from 'react-router-dom'

export default function Unauthorized() {
  return (
    <div style={{ textAlign: 'center', marginTop: '15vh' }}>
      <h1>403</h1>
      <p>You don't have permission to view this page.</p>
      <Link to="/">Go home</Link>
    </div>
  )
}
