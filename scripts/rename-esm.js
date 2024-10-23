const fs = require( 'fs' );
const path = require( 'path' );

function renameToMjs( dir )
{
    const files = fs.readdirSync( dir );

    files.forEach( file =>
    {
        const filePath = path.join( dir, file );
        if ( fs.statSync( filePath ).isDirectory() )
        {
            renameToMjs( filePath );
        } else if ( file.endsWith( '.js' ) )
        {
            fs.renameSync(
                filePath,
                path.join( dir, file.replace( '.js', '.mjs' ) )
            );
        }
    } );
}

renameToMjs( './dist/esm' );