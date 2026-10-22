import { Reels } from '@flipatic/flip-reel-react'
import { createDemoOptions } from '@flipatic/flip-reel-demo-shared'

const options = createDemoOptions()

export function App() {
  return (
    <>
      <header className="demo-header">
        <div className="demo-header__inner">
          <a className="demo-brand" href="https://flipatic.com">
            <img src="/brand/flipatic.svg" alt="Flipatic" />
          </a>
          <div className="demo-actions">
            <span className="demo-badge">React</span>
            <a className="demo-github" href="https://github.com/Flipatic/flip-reel">
              GitHub
            </a>
          </div>
        </div>
      </header>
      <main className="demo-main">
        <p className="demo-lede">
          A React page embedding the FlipReel widget via <code>@flipatic/flip-reel-react</code>.
          Hover a card to preview, click to open the full-screen player with categories, ads and
          interactions.
        </p>
        <Reels
          options={options}
          onOpen={(event) => console.info('[react] open', event.detail.storyId, event.detail.index)}
          onShare={(event) => console.info('[react] share', event.detail.storyId)}
        />
      </main>
    </>
  )
}
