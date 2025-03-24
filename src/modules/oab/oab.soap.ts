import soap from 'soap';

const url = 'https://www5.oab.org.br/cnaws/service.asmx?WSDL';

soap.createClient(url, (err, client) => {
  if (err) console.error(err);
  else {
    client.ConsultaAdvogado(
      { inscricao: '12345', uf: 'SP', nome: 'Fulano' },
      (_err: Error | null, result: any) => console.log(result)
    );
  }
});
