#!/bin/bash
set -x # Show the output of the following commands (useful for debugging)
    
# Import the SSH deployment key
chmod 600 do-deployPPK
mv do-deployPPK ~/.ssh/id_rsa