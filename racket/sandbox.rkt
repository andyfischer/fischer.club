#lang racket

(require net/http-easy)

(define (run-command cmd)
  (let ([response (post "http://localhost:4300/run"
                        #:json (hasheq 'commands (list cmd))
                        )])
    (response-body response)
    ))
  

; (run-command "/setblock 183 88 -70 command_block 0 replace")