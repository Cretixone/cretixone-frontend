declare module 'react-rating-stars-component' {
  import type { ComponentType } from 'react'

  interface ReactStarsProps {
    count?: number
    value?: number
    onChange?: (newValue: number) => void
    size?: number
    isHalf?: boolean
    edit?: boolean
    color?: string
    activeColor?: string
    char?: string
    a11y?: boolean
    classNames?: string
    emptyIcon?: React.ReactElement
    halfIcon?: React.ReactElement
    filledIcon?: React.ReactElement
  }

  const ReactStars: ComponentType<ReactStarsProps>
  export default ReactStars
}
