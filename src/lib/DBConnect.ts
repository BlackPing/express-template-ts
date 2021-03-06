import DB_CONF from '../Config/DatabaseInfo';
import mariadb from 'mariadb';
const pool = mariadb.createPool(DB_CONF.mariadb);

interface resultType {
  state: boolean,
  rows: any
}
 
async function asyncFunction(query: any, ps: any) {
    let conn: any;
    let result: resultType = {
      state: false,
      rows: undefined
    };

    let error_type = 0;
    let transaction_select: any = {};

    try {
      if(query instanceof Array) {
        conn = await pool.getConnection(); //  DB 연결
        await conn.beginTransaction(); // 트랙잭션

        // 트랜잭션 처리 배열 순차 실행
        for(var index in query) {
          const rows = await conn.query(query[index], ps[index]);
          if(query[index].toLowerCase().indexOf('select') == 0) { // 셀렉트 문이라면 값 리턴
            transaction_select['data' + index] = rows;
          }
        }

        result.rows = transaction_select;
      } else if(typeof query == 'string') {
        // 트랜잭션 처리를 하지 않음
        conn = await pool.getConnection(); //  DB 연결
        const rows = await conn.query(query, ps);

        if(query.toLowerCase().indexOf('select') == 0) { // 셀렉트 문이라면 값 리턴
          result.rows = rows;
        }
      } else { // exception
        error_type = 0x01;
        throw "No Such Type";
      }

      console.log(result.rows);
      result.state = true;
      await conn.commit();
    } catch (err) {
        console.error(err);
        result.state = false;
        if(error_type != 0x01) await conn.rollback();
        throw err;
    } finally {
        if (conn) conn.release();
        return result;
    }
}

export default asyncFunction;