import { Button } from './components/Button/Button'
import './App.css'

function App() {
  return (
    <main className="app-shell">
      <p className="eyebrow">Component workspace</p>
      <h1>Agentic Design System</h1>
      <p>
        Build components in <code>src/components</code> and explore their states in Storybook.
      </p>
      <div className="app-actions">
        <Button onClick={() => window.open('http://localhost:6006', '_blank')}>
          Open Storybook
        </Button>
        <Button variant="secondary" disabled>More components soon</Button>
      </div>
    </main>
  )
}

export default App
