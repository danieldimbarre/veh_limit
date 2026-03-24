fx_version 'cerulean'
games { 'gta5' }

author 'Daniel Dimbarre'
description 'Template resource'
version '1.0.0'

files {
    'dist/shared/**/*.js'
}

server_script 'dist/server/**/*.js'
client_script 'dist/client/**/*.js'

node_version '22'