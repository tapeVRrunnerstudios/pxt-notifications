namespace SpriteKind {
    export const Notification = SpriteKind.create()
}

enum NotificationStyle {
    //% block="banner"
    Banner,
    //% block="toast"
    Toast,
    //% block="bubble"
    Bubble,
    //% block="popup window"
    Popup,
    //% block="retro"
    Retro
}

enum NotificationPosition {
    //% block="top"
    Top,
    //% block="middle"
    Middle,
    //% block="bottom"
    Bottom
}

enum NotificationAnimation {
    //% block="slide"
    Slide,
    //% block="pop"
    Pop
}

enum NotificationSound {
    //% block="no sound"
    None,
    //% block="ping"
    Ping,
    //% block="success"
    Success,
    //% block="warning"
    Warning,
    //% block="error"
    Error
}

enum NotificationIconSide {
    //% block="start"
    Start,
    //% block="end"
    End
}

enum NotificationIcon {
    //% block="info"
    Info,
    //% block="warning"
    Warning,
    //% block="check"
    Check,
    //% block="error"
    Error,
    //% block="star"
    Star,
    //% block="heart"
    Heart
}

/**
 * Pop-up notifications with a choice of style, icon, sound and animation.
 */
//% weight=100 color=#F4B400 icon="\uf0f3" block="Notifications"
//% groups='["Show", "Icons", "Settings", "Control", "Events"]'
namespace notifications {

    class NoteData {
        style: NotificationStyle
        icon: Image
        title: string
        text: string
        position: NotificationPosition
        ms: number
        sound: NotificationSound
        animation: NotificationAnimation
        constructor(style: NotificationStyle, icon: Image, title: string, text: string,
            position: NotificationPosition, ms: number, sound: NotificationSound,
            animation: NotificationAnimation) {
            this.style = style
            this.icon = icon
            this.title = title
            this.text = text
            this.position = position
            this.ms = ms
            this.sound = sound
            this.animation = animation
        }
    }

    // ---- state ----
    let queue: NoteData[] = []
    let current: Sprite = null
    let currentData: NoteData = null
    let phase = 0 // 0 = entering, 1 = holding, 2 = leaving
    let phaseTimer = 0
    let offY = 0
    let targetY = 0

    // ---- settings ----
    let bgColor = 15
    let borderColor = 1
    let bodyColor = 1
    let headColor = 5
    let defaultSeconds = 2.5
    let slideSpeed = 220
    let iconSide = NotificationIconSide.Start

    let shownHandler: () => void = null
    let closedHandler: () => void = null

    // ---- public blocks ----

    /**
     * Show a notification. The icon appears at the start of the message by default.
     */
    //% blockId=notifications_show
    //% block="show $style notification icon $icon title $title text $text"
    //% icon.shadow=screen_image_picker
    //% inlineInputMode=inline
    //% weight=100 group="Show"
    export function show(style: NotificationStyle, icon: Image, title: string, text: string) {
        enqueue(new NoteData(style, icon, title, text, NotificationPosition.Top,
            Math.round(defaultSeconds * 1000), NotificationSound.None, NotificationAnimation.Slide))
    }

    /**
     * Show a notification and choose where it appears, how it moves, a sound and how long it stays.
     */
    //% blockId=notifications_show_advanced
    //% block="show $style notification at $position animation $animation sound $sound for $seconds s|icon $icon title $title text $text"
    //% icon.shadow=screen_image_picker
    //% seconds.defl=2.5 seconds.min=0.5 seconds.max=30
    //% inlineInputMode=external
    //% weight=90 group="Show"
    export function showAdvanced(style: NotificationStyle, position: NotificationPosition,
        animation: NotificationAnimation, sound: NotificationSound, seconds: number,
        icon: Image, title: string, text: string) {
        enqueue(new NoteData(style, icon, title, text, position,
            Math.round(seconds * 1000), sound, animation))
    }

    /**
     * A ready-made icon to use in a notification.
     */
    //% blockId=notifications_preset_icon
    //% block="preset icon $preset"
    //% weight=80 group="Icons"
    export function presetIcon(preset: NotificationIcon): Image {
        if (preset == NotificationIcon.Info) {
            const img = image.create(11, 11)
            img.fillCircle(5, 5, 5, 8)
            img.fillRect(4, 2, 3, 2, 1)
            img.fillRect(5, 5, 1, 4, 1)
            img.fillRect(4, 5, 1, 1, 1)
            img.fillRect(4, 8, 3, 1, 1)
            return img
        } else if (preset == NotificationIcon.Warning) {
            const img = image.create(11, 10)
            for (let y = 0; y < 10; y++) {
                const half = Math.idiv(y * 5, 9)
                img.fillRect(5 - half, y, half * 2 + 1, 1, 5)
            }
            img.fillRect(5, 3, 1, 4, 15)
            img.fillRect(5, 8, 1, 1, 15)
            return img
        } else if (preset == NotificationIcon.Check) {
            const img = image.create(11, 11)
            img.fillCircle(5, 5, 5, 7)
            img.drawLine(3, 5, 4, 6, 1)
            img.drawLine(4, 6, 8, 3, 1)
            img.drawLine(3, 6, 4, 7, 1)
            img.drawLine(4, 7, 8, 4, 1)
            return img
        } else if (preset == NotificationIcon.Error) {
            const img = image.create(11, 11)
            img.fillCircle(5, 5, 5, 2)
            img.drawLine(3, 3, 7, 7, 1)
            img.drawLine(4, 3, 7, 6, 1)
            img.drawLine(3, 4, 6, 7, 1)
            img.drawLine(3, 7, 7, 3, 1)
            img.drawLine(4, 7, 7, 4, 1)
            img.drawLine(3, 6, 6, 3, 1)
            return img
        } else if (preset == NotificationIcon.Star) {
            return fromRows([
                "....5....",
                "....5....",
                "...555...",
                "555555555",
                ".5555555.",
                "..55555..",
                "..55555..",
                ".555.555.",
                ".55...55."
            ])
        } else {
            return fromRows([
                ".22...22.",
                "2222.2222",
                "222222222",
                "222222222",
                ".2222222.",
                "..22222..",
                "...222...",
                "....2...."
            ])
        }
    }

    /**
     * Set the colors used by new notifications.
     */
    //% blockId=notifications_set_colors
    //% block="set notification colors background $bg border $border text $textColor title $titleColor"
    //% bg.shadow=colorindexpicker bg.defl=15
    //% border.shadow=colorindexpicker border.defl=1
    //% textColor.shadow=colorindexpicker textColor.defl=1
    //% titleColor.shadow=colorindexpicker titleColor.defl=5
    //% inlineInputMode=inline
    //% weight=70 group="Settings"
    export function setColors(bg: number, border: number, textColor: number, titleColor: number) {
        bgColor = bg
        borderColor = border
        bodyColor = textColor
        headColor = titleColor
    }

    /**
     * Choose which side of the message the icon is on.
     */
    //% blockId=notifications_set_icon_side
    //% block="set notification icon at $side of message"
    //% weight=60 group="Settings"
    export function setIconSide(side: NotificationIconSide) {
        iconSide = side
    }

    /**
     * How long notifications stay on screen by default (for the simple show block).
     */
    //% blockId=notifications_set_duration
    //% block="set default notification time to $seconds s"
    //% seconds.defl=2.5 seconds.min=0.5 seconds.max=30
    //% weight=50 group="Settings"
    export function setDefaultSeconds(seconds: number) {
        defaultSeconds = seconds
    }

    /**
     * How fast notifications slide in and out (pixels per second).
     */
    //% blockId=notifications_set_speed
    //% block="set notification slide speed to $pixelsPerSecond"
    //% pixelsPerSecond.defl=220 pixelsPerSecond.min=40 pixelsPerSecond.max=600
    //% weight=40 group="Settings"
    export function setSlideSpeed(pixelsPerSecond: number) {
        slideSpeed = pixelsPerSecond
    }

    /**
     * Close the notification that is on screen right now.
     */
    //% blockId=notifications_dismiss
    //% block="dismiss current notification"
    //% weight=30 group="Control"
    export function dismiss() {
        if (current != null && phase < 2) {
            phase = 2
        }
    }

    /**
     * Close the current notification and throw away all waiting ones.
     */
    //% blockId=notifications_clear
    //% block="clear all notifications"
    //% weight=25 group="Control"
    export function clearAll() {
        queue = []
        dismiss()
    }

    /**
     * True while a notification is on screen.
     */
    //% blockId=notifications_is_showing
    //% block="notification is showing"
    //% weight=20 group="Control"
    export function isShowing(): boolean {
        return current != null
    }

    /**
     * How many notifications are waiting to be shown.
     */
    //% blockId=notifications_waiting
    //% block="notifications waiting"
    //% weight=15 group="Control"
    export function waiting(): number {
        return queue.length
    }

    /**
     * Run code each time a notification appears.
     */
    //% blockId=notifications_on_shown
    //% block="on notification shown"
    //% weight=10 group="Events"
    export function onShown(handler: () => void) {
        shownHandler = handler
    }

    /**
     * Run code each time a notification goes away.
     */
    //% blockId=notifications_on_closed
    //% block="on notification closed"
    //% weight=9 group="Events"
    export function onClosed(handler: () => void) {
        closedHandler = handler
    }

    // ---- internals ----

    function enqueue(d: NoteData) {
        if (d.title == null) d.title = ""
        if (d.text == null) d.text = ""
        queue.push(d)
    }

    function fromRows(rows: string[]): Image {
        const digits = "0123456789abcdef"
        const img = image.create(rows[0].length, rows.length)
        for (let y = 0; y < rows.length; y++) {
            for (let x = 0; x < rows[y].length; x++) {
                const c = digits.indexOf(rows[y].charAt(x))
                if (c > 0) img.setPixel(x, y, c)
            }
        }
        return img
    }

    function wrap(text: string, font: image.Font, maxW: number): string[] {
        const chars = Math.max(1, Math.idiv(maxW, font.charWidth))
        const lines: string[] = []
        let cur = ""
        const words = text.split(" ")
        for (let word of words) {
            while (word.length > chars) {
                if (cur.length > 0) {
                    lines.push(cur)
                    cur = ""
                }
                lines.push(word.substr(0, chars))
                word = word.substr(chars, word.length - chars)
            }
            const t = cur.length == 0 ? word : cur + " " + word
            if (t.length > chars && cur.length > 0) {
                lines.push(cur)
                cur = word
            } else {
                cur = t
            }
        }
        if (cur.length > 0) lines.push(cur)
        if (lines.length == 0) lines.push("")
        return lines
    }

    function roundRect(img: Image, x: number, y: number, w: number, h: number, c: number) {
        img.fillRect(x + 1, y, w - 2, h, c)
        img.fillRect(x, y + 1, w, h - 2, c)
    }

    function maxWidthFor(style: NotificationStyle): number {
        let w = 130
        if (style == NotificationStyle.Banner) w = screen.width
        else if (style == NotificationStyle.Toast) w = 110
        else if (style == NotificationStyle.Bubble) w = 120
        return Math.min(w, screen.width - 4)
    }

    function render(d: NoteData): Image {
        const font = image.font5
        const lh = font.charHeight + 2
        const banner = d.style == NotificationStyle.Banner
        const popup = d.style == NotificationStyle.Popup
        const bubble = d.style == NotificationStyle.Bubble
        const pad = banner ? 4 : 5
        const hasIcon = d.icon != null
        const iconW = hasIcon ? d.icon.width : 0
        const iconH = hasIcon ? d.icon.height : 0
        const gap = hasIcon ? 4 : 0

        const maxTextW = Math.max(font.charWidth * 4, maxWidthFor(d.style) - pad * 2 - iconW - gap)
        const bodyLines = wrap(d.text, font, maxTextW)
        let titleLines: string[] = []
        if (!popup && d.title.length > 0) titleLines = wrap(d.title, font, maxTextW)

        let popupTitle = d.title.length > 0 ? d.title : "Notice"
        const popupChars = Math.max(1, Math.idiv(maxWidthFor(d.style) - pad * 2, font.charWidth))
        if (popupTitle.length > popupChars) popupTitle = popupTitle.substr(0, popupChars)

        let textW = 0
        for (let l of bodyLines) textW = Math.max(textW, l.length * font.charWidth)
        for (let l of titleLines) textW = Math.max(textW, l.length * font.charWidth)
        const textH = (titleLines.length + bodyLines.length) * lh - 2
        const contentH = Math.max(iconH, textH)
        const barH = popup ? 10 : 0
        const tailH = bubble ? 4 : 0
        const innerW = iconW + gap + textW

        let w = innerW + pad * 2
        if (popup) w = Math.max(w, popupTitle.length * font.charWidth + pad * 2)
        w = Math.max(w, 30)
        if (banner) w = screen.width
        w = Math.min(w, screen.width)
        const bodyH = pad * 2 + contentH + barH
        const h = bodyH + tailH

        const img = image.create(w, h)

        // frame
        if (banner) {
            img.fill(bgColor)
            img.fillRect(0, d.position == NotificationPosition.Top ? h - 1 : 0, w, 1, borderColor)
        } else if (d.style == NotificationStyle.Retro) {
            img.fillRect(0, 0, w, h, borderColor)
            img.fillRect(1, 1, w - 2, h - 2, bgColor)
            img.drawRect(3, 3, w - 6, h - 6, borderColor)
        } else {
            roundRect(img, 0, 0, w, bodyH, borderColor)
            roundRect(img, 1, 1, w - 2, bodyH - 2, bgColor)
            if (popup) {
                img.fillRect(1, 1, w - 2, barH - 1, borderColor)
                img.print(popupTitle, pad, 2, bgColor, font)
            }
            if (bubble) {
                const cx = Math.idiv(w, 2)
                for (let i = 0; i < 5; i++) {
                    img.fillRect(cx - 4 + i, bodyH - 1 + i, 9 - 2 * i, 1, borderColor)
                }
                for (let i = 0; i < 4; i++) {
                    img.fillRect(cx - 3 + i, bodyH - 1 + i, 7 - 2 * i, 1, bgColor)
                }
            }
        }

        // content
        const contentX = Math.idiv(w - innerW, 2)
        const contentY = barH + pad
        let iconX = contentX
        let textX = contentX + iconW + gap
        if (iconSide == NotificationIconSide.End) {
            textX = contentX
            iconX = contentX + textW + gap
        }
        if (hasIcon) {
            img.drawTransparentImage(d.icon, iconX, contentY + Math.idiv(contentH - iconH, 2))
        }
        let ty = contentY + Math.idiv(contentH - textH, 2)
        for (let l of titleLines) {
            img.print(l, textX, ty, headColor, font)
            ty += lh
        }
        for (let l of bodyLines) {
            img.print(l, textX, ty, bodyColor, font)
            ty += lh
        }
        return img
    }

    function playSound(s: NotificationSound) {
        if (s == NotificationSound.None) return
        control.runInParallel(function () {
            if (s == NotificationSound.Ping) {
                music.playTone(988, 70)
                music.playTone(1319, 110)
            } else if (s == NotificationSound.Success) {
                music.playTone(523, 80)
                music.playTone(659, 80)
                music.playTone(784, 140)
            } else if (s == NotificationSound.Warning) {
                music.playTone(440, 120)
                music.playTone(440, 120)
            } else {
                music.playTone(330, 140)
                music.playTone(220, 220)
            }
        })
    }

    function startNext() {
        currentData = queue.shift()
        const img = render(currentData)
        current = sprites.create(img, SpriteKind.Notification)
        current.z = 1000
        current.setFlag(SpriteFlag.RelativeToCamera, true)
        current.setFlag(SpriteFlag.Ghost, true)

        const h = img.height
        const margin = currentData.style == NotificationStyle.Banner ? 0 : 2
        if (currentData.style == NotificationStyle.Toast) {
            current.x = screen.width - margin - Math.idiv(img.width, 2)
        } else {
            current.x = Math.idiv(screen.width, 2)
        }
        if (currentData.position == NotificationPosition.Top) {
            targetY = margin + h / 2
            offY = -h / 2 - 1
        } else if (currentData.position == NotificationPosition.Middle) {
            targetY = screen.height / 2
            offY = -h / 2 - 1
        } else {
            targetY = screen.height - margin - h / 2
            offY = screen.height + h / 2 + 1
        }

        phaseTimer = 0
        if (currentData.animation == NotificationAnimation.Slide) {
            current.y = offY
            phase = 0
        } else {
            current.y = targetY
            phase = 1
        }
        playSound(currentData.sound)
        if (shownHandler) shownHandler()
    }

    function moveToward(goal: number, dt: number): boolean {
        const maxMove = slideSpeed * dt
        const diff = goal - current.y
        if (Math.abs(diff) <= maxMove) {
            current.y = goal
            return true
        }
        current.y += diff > 0 ? maxMove : -maxMove
        return false
    }

    function finish() {
        current.destroy()
        current = null
        currentData = null
        if (closedHandler) closedHandler()
    }

    game.onUpdate(function () {
        if (current == null) {
            if (queue.length > 0) startNext()
            return
        }
        const dt = control.eventContext().deltaTime
        if (phase == 0) {
            if (moveToward(targetY, dt)) phase = 1
        } else if (phase == 1) {
            phaseTimer += dt * 1000
            if (phaseTimer >= currentData.ms) phase = 2
        } else {
            if (currentData.animation == NotificationAnimation.Pop) {
                finish()
            } else if (moveToward(offY, dt)) {
                finish()
            }
        }
    })
}