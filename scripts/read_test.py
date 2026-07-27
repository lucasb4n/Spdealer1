import pandas as pd
p='database\\PLANEJAMENTO financeiro ATUALIZADO 2.0.xlsx'
try:
    df=pd.read_excel(p, header=[3,5], sheet_name='PLANJ 2025', engine='openpyxl')
    print('Read with header [3,5]. columns sample:')
    cols=df.columns.tolist()
    for i,c in enumerate(cols[:60]):
        print(i, repr(c))
except Exception as e:
    print('Error', e)
