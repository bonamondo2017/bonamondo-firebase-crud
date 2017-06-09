import { Injectable } from '@angular/core';

/*Firebase*/
import { fbDatabase } from './../../../environments/firebase-database.config';

@Injectable()
export class CrudService {

  constructor() {}

  /*
    CREATE
    Problema:
    Performance tá uma merda porque em cada iteração de elemento está sendo feita uma ação com o firebase
    Porque:
    Para lidar com subchilds suas propriedades e valores dentro da child que está sendo iterada, por exemplo, é preciso alterar a ref para a child, por isso não dá pra simplesmente montar todo o objeto e enviar pra uma mesma ref
    Solução:
    Pensar
  */
  create = (child: any, objectToPush: any, ...params) => new Promise((resolve, reject) => {
    let arr: any;
    let check: any;
    let countChildIteration: number; //Para ver se é a primeira iteração da child e definir se a acão será push ou update
    let keyToUpdate: any;//APAGAR NO CASO DE RESOLVER A SITUAÇÃO DE MELHORA DA PERFORMANCE
    let lastKey: any;
    let lastSubchild: any;
    let obj: any;
    let objectFromSpecificKey: any;
    let ref: any;
    let ref2: any;
    let setKey: boolean;
    
    if(child.length < 1 || child == undefined) { // Verifica se pelo menos uma child foi definida
      reject({
        cod: "c-01",
        message: "Informar erro c-01 ao administrador"
      });
    }
    
    for(let i = 0; i < child.length; i++) { //Ryzzan: child to create i
      check = null;
      countChildIteration = 0;
      //obj = {}; //VOLTAR NO CASO DE RESOLVER A SITUAÇÃO DE MELHORA DA PERFORMANCE
      objectFromSpecificKey = {};
      ref = fbDatabase.ref(child[i]); // Referencia a child onde será inserido o registro
      setKey = true; // Variável boleana responsável por identicar a existência ou não de uma sub-child (child dentro de child)

      for (let k in objectToPush){ // Loop que varre todos os campos do formulário
        obj = {}; //APAGAR NO CASO DE RESOLVER A SITUAÇÃO DE MELHORA DA PERFORMANCE
        if(objectToPush.hasOwnProperty(k)) {
          check = k.split('_'); // Divide a 'tag' de cada formControl (campos do form) criando um array. Ex.: ['field', '0', 'name']
          if(check[1] == i) { // Verifica se a iteração do formControl (campos do form) corresponde a iteração do loop
            if(check[0] === "field") { // Verifica se o formControl está configurado como um campo simples
              if(objectToPush[k] != undefined) {
                obj[check[2]] = objectToPush[k]; // Insere na variável obj o nome do campo e seu valor
                /*APAGAR NO CASO DE RESOLVER A SITUAÇÃO DE MELHORA DA PERFORMANCE INICIO*/
                if(countChildIteration < 1) {
                  if(setKey) { // Verifica se é a chave principal ou a sub-child
                    let key = ref.push(obj).key; // Cria a chave principal
                    
                    lastKey = {
                      key: key, // Retorna a key do objeto recém criado
                      child: child[i] // Retorna o nome da child principal
                    }

                    keyToUpdate = key;
                  } else {
                    let key = ref.push(obj).key;
                    keyToUpdate = key;
                  }
                } else {
                  ref2 = fbDatabase.ref(child[i]+"/"+keyToUpdate);
                  ref2.update(obj);
                }
                /*APAGAR NO CASO DE RESOLVER A SITUAÇÃO DE MELHORA DA PERFORMANCE FIM*/
              }
            }
            
            if(check[0] === "updateFromSpecificKey") { // Identifica o campo como um array de valores dentro da uma child recém criada
              if(objectToPush[k] != undefined || objectToPush[k] != ""){
                if(Array.isArray(objectToPush[k]))
                  arr = objectToPush[k]; // Cria um array com todos os elementos que serão inseridos dentro da child recém criada
                else
                  arr = objectToPush[k].split(";");
                for(let j = 0; j < arr.length; j++) { // Loop que varre todos os elementos que serão inseridos dentro da child recém criada
                  ref2 = fbDatabase.ref(lastKey.child+"/"+lastKey.key).child(child[i]); // Referencia a sub-child onde será inserido o registro
                  objectFromSpecificKey[arr[j].__key] = arr[j]; // Inseri na variável objectFromSpecificKey todos os elementos com valor true
                  ref2.update(objectFromSpecificKey); // Cria a sub-child com cada elemento dentro da child principal
                }
              }
              setKey = false; // Identifica a existência de uma sub-child (child dentro de child)
            }

            /* Adicionando subchild na child da iteração atual parar inserir propriedade(s) e valor(es) nela início*/
            if(check[0] === "subchild") { //Flag para a subchild por vir
              if(objectToPush[k] != undefined) {
                lastSubchild = check[2];
              }
            }

            if(check[0] === "subchildPropertyAndValue") { //Mordendo a língua sobre a crítica a respeito dos métodos Java
              if(objectToPush[k] != "" && objectToPush[k] != null && objectToPush[k] != undefined && lastSubchild != undefined) {
                obj[check[2]] = objectToPush[k];

                /*APAGAR NO CASO DE RESOLVER A SITUAÇÃO DE MELHORA DA PERFORMANCE INICIO*/
                if(countChildIteration < 1) {
                  if(setKey) { // Verifica se é a chave principal ou a sub-child
                    ref2 = fbDatabase.ref(child[i]+"/"+lastSubchild);
                    let key = ref2.push(obj).key; // Cria a chave principal
                    
                    lastKey = {
                      key: key, // Retorna a key do objeto recém criado
                      child: child[i] // Retorna o nome da child principal
                    }

                    keyToUpdate = key;
                  } else {
                    let key = ref.push(obj).key;
                    keyToUpdate = key;
                  }
                } else {
                  ref2 = fbDatabase.ref(child[i]+"/"+keyToUpdate).child(lastSubchild);
                  ref2.update(obj);
                }
                /*APAGAR NO CASO DE RESOLVER A SITUAÇÃO DE MELHORA DA PERFORMANCE FIM*/
              }
            }

            /* Adicionando subchild na child da iteração atual parar inserir propriedade(s) e valor(es) nela fim*/
            
            /*APAGAR NO CASO DE RESOLVER A SITUAÇÃO DE MELHORA DA PERFORMANCE INICIO*/
            if(check[0] != "subchild" && (countChildIteration == 0 && objectToPush[k] != undefined)) { //Preocupação em não faze o count caso newSubChild seja o primeiro elemento do form
              countChildIteration ++;
            }
            /*APAGAR NO CASO DE RESOLVER A SITUAÇÃO DE MELHORA DA PERFORMANCE FIM*/
          }
        }
      }

      /*VOLTAR NO CASO DE RESOLVER MELHORA DA PERFORMANCE INÍCIO*/
      /*if(setKey) { // Verifica se é a chave principal ou a sub-child
        let key = ref.push(obj).key; // Cria a chave principal
        
        lastKey = {
          key: key, // Retorna a key do objeto recém criado
          child: child[i] // Retorna o nome da child principal
        }
      } else {
        ref.push(obj);
      }*/
    /*VOLTAR NO CASO DE RESOLVER MELHORA DA PERFORMANCE FIM*/
    }

    resolve({
      cod: "c-02",
      message: "Cadastro feito com sucesso"//Cadastro feito com sucesso
    });
  })

  readArray = (params) => new Promise((resolve, reject) => {
    /*
    RYZZAN
    child: child,
    attributes: [childs.attributes],
    filters:[[orderByChild1][equalTo]],
    limit: [start, finish] //if only one array is set, set start as 1 and the only set value will be finish
    */
    let child;
    let orderByChild;
    let equalTo;

    let ref;
    let key;
    let obj;
    let objFiltered = [];
    let res;

    if(!params) {
      reject({
        cod: "ra-01",
        message: "Informar erro ra-01 ao administrador"//Checar parâmetros obrigatórios
      });
    }

    if(!params.child) {
      reject({
        cod: "ra-02",
        message: "Informar erro ra-02 ao administrador"//É preciso declarar ao menos um child"
      });
    }
    
    if(params.orderByChild) {
      if(!params.equalTo) {
        reject({
          cod: "ra-03",
          message: "Informar erro ra-03 ao administrador"//É preciso declarar um equalTo referente ao orderByChild
        });
      }

      orderByChild = params.orderByChild;
      equalTo = params.equalTo;
    }

    child = params.child;

    ref = fbDatabase.ref(child);
    
    if(orderByChild) {
      ref
      .orderByChild(orderByChild)
      .equalTo(equalTo)
      .on('value', snap => {
        if(snap.val() != null) {
          res = snap.val();
          key = Object.keys(res);
          
          obj = Object.keys(res).map(k => res[k]); //Tranformando objetos em arrays
          for(let i=0; i<Object.keys(res).length; i++){
            obj[i].__key = key[i];
          }

          if(params.keys) {
            for(let i= 0; i < obj.length; i++) {
              let temp = {};

              for(let j = 0; j < params.keys.length; j++) {
                temp[params.keys[j]] = obj[i][params.keys[j]];
              }

              /*Object.keys(obj[i])
              .map(k => {
                for(let j = 0; j < params.keys.length; j++) {
                  if(k == params.keys[j]) {
                    temp[k] = obj[i][k];
                  }
                }
              })*/
              objFiltered.push(temp);
            }
            
            resolve(objFiltered);
          } else {
            resolve(obj);
          }
        }
      })
    } else {
      ref
      .once('value')
      .then(snap => {
        if(snap.val() != null) {
          res = snap.val();
          key = Object.keys(res);
          obj = Object.keys(res).map(k => res[k]); //Tranformando objetos em arrays
          
          for(let i=0; i<Object.keys(res).length; i++){
            obj[i].__key = key[i];
          }
          
          if(params.keys) {
            for(let i= 0; i < obj.length; i++) {
              let temp = {};

              for(let j = 0; j < params.keys.length; j++) {
                temp[params.keys[j]] = obj[i][params.keys[j]];
              }

              /*Object.keys(obj[i])
              .map(k => {
                for(let j = 0; j < params.keys.length; j++) {
                  if(k == params.keys[j]) {
                    temp[k] = obj[i][k];
                  }
                }
              })*/
              objFiltered.push(temp);
            }
            
            resolve(objFiltered);
          } else {
            resolve(obj);
          }
        } else {
          resolve({
            cod: "ra-03",
            message: "Nenhum cadastro"//É preciso declarar ao menos um child"
          });
        }
      })
    }
  })

  readObject = (params) => new Promise((resolve, reject) => {
    /*
    RYZZAN
    child: child,
    attributes: [childs.attributes],
    filters:[[orderByChild1][equalTo]],
    limit: [start, finish] //if only one array is set, set start as 1 and the only set value will be finish
    */
    let child;
    let orderByChild;
    let equalTo;

    let ref;
    let key;
    let obj;
    let res;

    if(!params) {
      reject({
        cod: "ro-01",
        message: "Informar erro ro-01 ao administrador"//Checar parâmetros obrigatórios
      });
    }

    if(!params.child) {
      reject({
        cod: "ro-02",
        message: "Informar erro ro-02 ao administrador"//É preciso declarar ao menos um child
      });
    }

    if(params.orderByChild) {
      if(!params.equalTo) {
        reject({
          cod: "ro-03",
          message: "Informar erro ro-03 ao administrador"//É preciso declarar um equalTo referente ao orderByChild
        });
      }

      orderByChild = params.orderByChild;
      equalTo = params.equalTo;
    }
    
    child = params.child;

    ref = fbDatabase.ref(child);

    if(orderByChild) {
      ref
      .orderByChild(orderByChild)
      .equalTo(equalTo)
      .once('value')
      .then(snap => {
        res = snap.val();

        if(res === null) {
          reject({
            cod: "ro-04",
            message: "Nenhum dado gravado na child " + child
          });
        } else {
          key = Object.keys(res);
          obj = Object.keys(res).map(k => res[k]); //Tranformando objetos em arrays
          obj[0].__key = key[0];
          resolve(obj[0]);
        }
      })
    } else {
      ref
      .once('value')
      .then(snap => {
        res = snap.val();
        
        if(res === null) {
          reject({
            cod: "ro-04",
            message: "Nenhum dado gravado na child " + child
          });
        } else {
          key = Object.keys(res);
          obj = Object.keys(res).map(k => res[k]); //Tranformando objetos em arrays
          obj[0].__key = key[0];
          resolve(obj[0]);
        }
      })
    }
  })
  
  update = (child: any, idChildToUpdate: any, objectToUpdate: any, ...params) => new Promise((resolve, reject) => {
    let arr: any;
    let check: any;
    let countChildIteration: number;
    let lastKey: any;
    let lastSubchild: any;
    let obj: any;
    let ref: any;
    let ref2: any;
    let setKey: boolean;
    let updateFromSpecificKey: any;

    if(child.length < 1 || child == undefined) { // Verifica se pelo menos uma child foi definida
      reject({
        cod: "c-01",
        message: "Informar erro c-01 ao administrador"
      });
    }

    for(let i = 0; i < child.length; i++) { //child to create in
      if(idChildToUpdate[i]) {
        ref = fbDatabase.ref(child[i]).child(idChildToUpdate[i]); // Referencia a child com o registro que será atualizado
      } 
      
      check = null;
      countChildIteration = 0;
      obj = {};
      setKey = true; // Varável boleana responsável por identicar a existência ou não de uma sub-child (child dentro de child)
      updateFromSpecificKey = {};

      for(let k in objectToUpdate){ // Loop que varre todos os campos do formulário
        if(objectToUpdate.hasOwnProperty(k)) {
          check = k.split('_'); // Divide a 'tag' de cada formControl (campos do form) criando um array. Ex.: ['field', '0', 'name']

          if(check[1] == i) { // Verifica se a iteração do formControl (campos do form) corresponde a iteração do loop
            if(check[0] === "field") { // Verifica se o formControl está configurado como um campo simples
              if(objectToUpdate[k] != undefined)
                obj[check[2]] = objectToUpdate[k]; // Inseri na variável obj o nome do campo e seu valor
            }

            if(check[0] === "updateFromSpecificKey") { // Identifica o campo como um array de valores dentro da uma child recém atualizada
              if(objectToUpdate[k] != undefined){
                if(Array.isArray(objectToUpdate[k]))
                  arr = objectToUpdate[k]; // Cria um array com todos os elementos que serão inseridos dentro da child recém criada
                else
                  arr = objectToUpdate[k].split(";");
                fbDatabase.ref(lastKey.child+"/"+lastKey.key).child(child[i]).remove(); // Apaga todos os registros na sub-child antes de povoá-los com os dados atualizados

                for(let j = 0; j < arr.length; j++) { // Loop que varre todos os elementos que serão inseridos dentro da child recém atualizada
                  ref2 = fbDatabase.ref(lastKey.child+"/"+lastKey.key).child(child[i]); // Referencia a sub-child onde será inserido o registro
                  updateFromSpecificKey[arr[j]] = 1; // Inseri na variável updateFromSpecificKey todos os elementos com valor true
                  ref2.set(updateFromSpecificKey); // Cria a sub-child com cada elemento dentro da child principal
                }
              }
              setKey = false; // Identifica a existência de uma sub-child (child dentro de child)
            }

            /* Adicionando subchild na child da iteração atual parar inserir propriedade(s) e valor(es) nela início*/
            if(check[0] === "subchild") { //Flag para a subchild por vir
              if(objectToUpdate[k] != undefined) {
                lastSubchild = check[2];
              }
            }

            if(objectToUpdate[k] != undefined && lastSubchild != undefined) {
              obj[check[2]] = objectToUpdate[k];

              /*APAGAR NO CASO DE RESOLVER A SITUAÇÃO DE MELHORA DA PERFORMANCE INICIO*/
              if(countChildIteration < 1) {
                if(setKey) { // Verifica se é a chave principal ou a sub-child
                  ref2 = fbDatabase.ref(child[i]+"/"+lastSubchild);
                  let key = ref2.push(obj).key; // Cria a chave principal
                  
                } else {
                  let key = ref.push(obj).key;
                }
              } else {
                ref2 = fbDatabase.ref(child[i]+"/"+idChildToUpdate[i]).child(lastSubchild);
                ref2.update(obj);
              }
              /*APAGAR NO CASO DE RESOLVER A SITUAÇÃO DE MELHORA DA PERFORMANCE FIM*/
            }
          }

          /*APAGAR NO CASO DE RESOLVER A SITUAÇÃO DE MELHORA DA PERFORMANCE INICIO*/
          if(check[0] != "subchild") { //Preocupação em não faze o count caso newSubChild seja o primeiro elemento do form
            countChildIteration ++;
          }
          /*APAGAR NO CASO DE RESOLVER A SITUAÇÃO DE MELHORA DA PERFORMANCE FIM*/
        }
      }
      if(setKey) { // Verifica se é a chave principal ou a sub-child
        ref.set(obj); // Atualiza a child principal
        lastKey = {
          key: idChildToUpdate[i], // Retorna a key da child principal
          child: child[i] // Retorna o nome da child principal
        }
      } else {
        ref.update(obj);
      }
    }

    resolve({
      cod: "u-01",
      message: "Atualização feita com sucesso" //Atualização feita com sucesso
    });
  })
  
  delete = (child: any, idChildToDelete: any, childRelated: any, ...params) => new Promise((resolve, reject) => {
    let ref: any;
    let ref2: any;
    let check: any;
    
    if(child.length < 1 || child == undefined) {
      reject({
        cod: "c-01",
        message: "Informar erro c-01 ao administrador"
      });
    }
    
    for(let i = 0; i < child.length; i++) { //child to delete in
      ref = fbDatabase.ref(child[i]);
      if(childRelated) { // Verifica se existem child que se relacionam com a child a ser excluída
        for(let j = 0; j < childRelated.length; j++) { // loop que varre todas as childs que se relacionam com a child a ser excluída
          check = childRelated[j].split('_'); // Ex.: Tranforma a child "0_productsClass" em ['0','productsClass']
          
          if(check[1] == i) { // Verifica se a child relacionada refere-se a child a ser excluída
            ref2 = fbDatabase.ref(check[2]); // referencia a child que child a ser excluída está relacionada
            ref2.orderByKey().once("value").then(res => { // loop que varre todas childs em busca da child a ser excluída
              res.forEach(childRes => { 
                let childIntoChild = childRes.hasChild(child[i] + "/" + idChildToDelete); // true = child tem relação || false = child não tem relação
                if(childIntoChild){
                  ref2.child(childRes.key).child(child[i] + "/" + idChildToDelete).remove(); // Deleta a relação
                }
              })
            })
          }
        }
      }
      
      ref.child(idChildToDelete).remove();
      
      /*ref
      .once('value')
      .then(snap => {
      }*/
    }
    
    resolve({
      crudMessage: {
        cod: "d-01",
        message: "Remoção feita com sucesso"
      }
    });
    
  }) 
}