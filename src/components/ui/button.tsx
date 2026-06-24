import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aether-cyan disabled:pointer-events-none disabled:opacity-50 active:scale-95',
  {
    variants: {
      variant: {
        default: 'bg-aether-cyan text-aether-bg hover:bg-cyan-300 glow-cyan',
        secondary: 'bg-aether-card text-aether-cyan border border-aether-border hover:border-aether-cyan',
        destructive: 'bg-aether-danger text-white hover:bg-red-400',
        ghost: 'hover:bg-aether-card text-slate-300',
        purple: 'bg-aether-purple text-white hover:bg-purple-400 glow-purple',
        gold: 'bg-aether-gold text-aether-bg hover:bg-yellow-300',
        outline: 'border border-aether-cyan text-aether-cyan bg-transparent hover:bg-aether-cyan/10',
      },
      size: {
        default: 'h-11 px-5 py-2',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-13 px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
