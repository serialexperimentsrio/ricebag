import {
  Box,
  Button,
  Dropdown,
  Icon,
  IconButton,
  Loading,
  Panel,
  Popover,
  Select,
  Tooltip,
  ModalBox,
  setModal,
  hideModal,
  toast,
  setToastLocation
} from 'ricebag'

const toSvgDataUri = (svg: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`

const resolveTokenColor = (token: string, fallback: string) => {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(token)
    .trim()
  return value || fallback
}

const createIcons = (fill: string) => ({
  SQUARE: toSvgDataUri(
    `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="16" height="16" fill="${fill}"/></svg>`
  ),
  CIRCLE: toSvgDataUri(
    `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="${fill}"/></svg>`
  ),
  TRIANGLE: toSvgDataUri(
    `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 22h20L12 2Z" fill="${fill}"/></svg>`
  )
})

function App() {
  const iconColor = resolveTokenColor(
    '--rb-color-accent',
    resolveTokenColor('--rb-color-bright', 'currentColor')
  )
  const ICONS = createIcons(iconColor)

  const triggerToast = () => {
    toast('Signal')
  }

  const showModal = () => {
    setModal(
      <ModalBox>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Dialog</h2>
          <div style={{ height: 'var(--rb-border-width)', background: 'var(--rb-color-accent)' }} />
          <p>This is a modal dialog component. It handles focus trapping and entrance animations.</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button style={{ flex: 1 }} onClick={hideModal}>Close</Button>
            <Button style={{ flex: 1 }} onClick={triggerToast}>Confirm</Button>
          </div>
        </div>
      </ModalBox>
    )
  }

  return (
    <div className="app-container">
      {/* Header Block */}
      <header className="cell cell-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="cell-title">Ricebag</h1>
            <p style={{ margin: 0, marginTop: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Component Library</p>
          </div>
          <Icon src={ICONS.SQUARE} width={60} />
        </div>
      </header>

      {/* Action Block */}
      <section className="cell span-4 row-span-3">
        <span className="label">Buttons</span>
        <h2>Interactions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Button onClick={triggerToast}>Default</Button>
          <Button onClick={triggerToast}>Secondary</Button>
          <div style={{ height: '40px' }} />
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <IconButton onClick={showModal}>
              <Icon src={ICONS.SQUARE} width={24} />
            </IconButton>
            <IconButton onClick={triggerToast}>
              <Icon src={ICONS.CIRCLE} width={24} />
            </IconButton>
            <IconButton onClick={triggerToast}>
              <Icon src={ICONS.TRIANGLE} width={24} />
            </IconButton>
          </div>
        </div>
      </section>

      {/* Selection Block */}
      <section className="cell span-8">
        <span className="label">Form</span>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Select 
            style={{ flex: 1 }}
            options={[
              { key: 'top-left', name: 'Location: Top Left', onPick: () => setToastLocation('left', 'top') },
              { key: 'top-right', name: 'Location: Top Right', onPick: () => setToastLocation('right', 'top') },
              { key: 'bottom-left', name: 'Location: Bottom Left', onPick: () => setToastLocation('left', 'bottom') },
              { key: 'bottom-right', name: 'Location: Bottom Right', default: true, onPick: () => setToastLocation('right', 'bottom') },
            ]}
          />
          <Dropdown 
            items={[
              { key: '1', label: 'Option A', onPick: triggerToast },
              { key: '2', label: 'Option B', onPick: triggerToast }
            ]}
          >
            <Button>Options</Button>
          </Dropdown>
        </div>
      </section>

      {/* Status Block */}
      <section className="cell span-4">
        <span className="label">Status</span>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loading />
          </div>
        </div>
      </section>

      {/* Overlays Block */}
      <section className="cell span-4">
        <span className="label">Overlays</span>
        <div style={{ display: 'flex', gap: '15px' }}>
          <Tooltip text="Tooltip content">
            <Box style={{ padding: '10px', textAlign: 'center', cursor: 'help', flex: 1, fontSize: '0.8rem' }}>Tooltip</Box>
          </Tooltip>
          <Popover content={<Box style={{ padding: '15px' }}>Popover content</Box>}>
            <Box style={{ padding: '10px', textAlign: 'center', cursor: 'pointer', flex: 1, fontSize: '0.8rem' }}>Popover</Box>
          </Popover>
        </div>
      </section>

      {/* Container Block */}
      <section className="cell span-8 row-span-2">
        <span className="label">Layout</span>
        <Panel title="Panel">
          <p style={{ margin: 0, opacity: 0.8, lineHeight: 1.6 }}>Panels provide a container for grouped content within the grid. They maintain structural consistency while providing containment.</p>
        </Panel>
      </section>

      {/* Footer Block */}
      <footer className="cell bg-invert span-4">
        <span className="label">Information</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <p style={{ fontSize: '0.8rem', margin: 0 }}>Ricebag Core</p>
          <p style={{ fontSize: '0.7rem', margin: 0, opacity: 0.6 }}>v1.0.0</p>
        </div>
      </footer>
    </div>
  )
}

export default App
