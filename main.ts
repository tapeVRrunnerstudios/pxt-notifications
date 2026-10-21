namespace notifications {

    export enum NotificationType {
        //% block="Info"
        Info,
        //% block="Success"
        Success,
        //% block="Warning"
        Warning
    }

    class NotificationMessage {
        constructor(public type: NotificationType, public icon: Image, public text: string, public duration: number) { }
    }

    let queue: NotificationMessage[] = [];
    let isShowing = false;

    /**
     * Show a popup notification with an icon, message, and display duration
     */
    //% block="show notification type %type|icon %icon|message %message|duration (sec) %duration"
    //% icon.shadow=spriteimage
    //% duration.defl=2
    export function showNotification(type: NotificationType, icon: Image, message: string, duration: number): void {
        queue.push(new NotificationMessage(type, icon, message, duration));

        if (!isShowing) {
            displayNextNotification();
        }
    }

    function displayNextNotification(): void {
        if (queue.length === 0) {
            isShowing = false;
            return;
        }

        isShowing = true;
        let current = queue.shift();

        // Create a banner container sprite
        let banner = sprites.create(image.create(140, 24), SpriteKind.Player);
        banner.x = 80; // Centered horizontally
        banner.y = -20; // Start hidden off-screen at the top
        banner.z = 100; // Ensure it renders on top of all other game elements

        // Set background color based on notification type
        let bgColor = 9; // Default Blue (Info)
        if (current.type === NotificationType.Success) {
            bgColor = 7; // Green
        } else if (current.type === NotificationType.Warning) {
            bgColor = 2; // Red/Orange
        }

        // Draw the notification look
        banner.image.fill(bgColor);
        banner.image.drawRect(0, 0, 140, 24, 15);
        banner.image.drawImage(current.icon, 4, 4);
        banner.image.print(current.text, 24, 8, 15);

        // Run the slide and timer animation in parallel so it doesn't freeze game logic
        control.runInParallel(function () {
            // 1. Slide down animation
            let targetY = 16;
            while (banner.y < targetY) {
                banner.y += 2;
                pause(15);
            }
            banner.y = targetY; // Snap to exact position

            // 2. Wait for the specified duration (convert seconds to milliseconds)
            pause(current.duration * 1000);

            // 3. Slide up animation
            while (banner.y > -20) {
                banner.y -= 2;
                pause(15);
            }

            // Cleanup and move to the next item in the queue
            banner.destroy();
            displayNextNotification();
        });
    }
}
