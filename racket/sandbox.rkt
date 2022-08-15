#lang racket

(require net/http-easy)

(define (run-commands cmds)
  (for ([cmd cmds])
    (displayln (format "running command: ~v" cmd))
    )
  (let ([response (post "https://fischer.club/run"
                        #:json (hasheq 'commands cmds)
                        )])
    (response-body response)
    ))

(define (run-command cmd)
  (run-commands (list cmd)))

(define (set-block x y z block_type change_type)
  (format "/setblock ~v ~v ~v ~v 0 ~v" x y z block_type change_type))

(define (set-blocks blocks block_type change_type)
  (for/list ([block blocks])
    (let ([x (list-ref block 0)] [y (list-ref block 1)] [z (list-ref block 2)])
      (format "/setblock ~v ~v ~v ~v 0 ~v" x y z block_type change_type)
      )))


(define (floor x1 y1 x2 y2 z)
  (append* (for/list ([x (in-range x1 x2)])
             (for/list ([y (in-range y1 y2)])
               (list x y z)))))

; (run-command "/setblock 183 88 -70 command_block 0 replace")
; (set-block 183 88 -70 "command_block" "replace")
; (run-command "/give \"das boot 27\" command_block")
; (run-commands (set-blocks (floor 0 0 4 4 3) 'gold 'replace)))

; Some commands:
; /fill <from: x y z> <to: x y z> <tileName: string> [tileData:int] [oldBlockHandling]
; /locate <feature: string>
; /summon <entityType: string> <spawnPos: x y z>
; /tp <destination: target>
; /tp <destination: x y z> [y-rot: int] [x-rot: int]
; /tp <victim: target> <destination: target>
; /tp <victim: target> <destination: x y z> [y-rot: int] [x-rot: int]
