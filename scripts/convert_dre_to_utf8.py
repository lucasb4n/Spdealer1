#!/usr/bin/env python3
import io
infile='reports/dre_mapped.tsv'
outfile='reports/dre_mapped_utf8.tsv'
with open(infile,'rb') as f:
    data=f.read()
# try utf-16 decoding
for enc in ('utf-16','utf-16-le','utf-16-be','utf-8'):
    try:
        text=data.decode(enc)
        with open(outfile,'w',encoding='utf-8') as out:
            out.write(text)
        print('decoded with',enc)
        break
    except Exception:
        pass
