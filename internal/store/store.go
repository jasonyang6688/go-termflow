package store

import (
	"database/sql"
	"strings"

	_ "modernc.org/sqlite"
)

type Connection struct {
	ID        int64  `json:"id"`
	Name      string `json:"name"`
	Host      string `json:"host"`
	Port      int    `json:"port"`
	User      string `json:"user"`
	Password  string `json:"password,omitempty"`
	KeyPath   string `json:"keyPath"`
	Kind      string `json:"kind"`
	WSLDistro string `json:"wslDistro"`
	Env       string `json:"env"`
	GroupName string `json:"groupName"`
}

type QuickCommand struct {
	ID           int64  `json:"id"`
	Label        string `json:"label"`
	Command      string `json:"command"`
	ConnectionID *int64 `json:"connectionId,omitempty"`
	SortOrder    int    `json:"sortOrder"`
}

type Store struct {
	db *sql.DB
}

func ensureConnectionColumns(db *sql.DB) error {
	for _, stmt := range []string{
		`ALTER TABLE connections ADD COLUMN kind TEXT NOT NULL DEFAULT 'ssh'`,
		`ALTER TABLE connections ADD COLUMN wsl_distro TEXT NOT NULL DEFAULT ''`,
	} {
		if _, err := db.Exec(stmt); err != nil && !isDuplicateColumnError(err) {
			return err
		}
	}
	return nil
}

func isDuplicateColumnError(err error) bool {
	return err != nil && strings.Contains(strings.ToLower(err.Error()), "duplicate column")
}

func New(path string) (*Store, error) {
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	if _, err := db.Exec(schema); err != nil {
		db.Close()
		return nil, err
	}
	if err := ensureConnectionColumns(db); err != nil {
		db.Close()
		return nil, err
	}
	return &Store{db: db}, nil
}

func (s *Store) Close() error { return s.db.Close() }

func (s *Store) SaveConnection(c Connection) (int64, error) {
	if c.Kind == "" {
		c.Kind = "ssh"
	}
	if c.ID > 0 {
		_, err := s.db.Exec(
			`UPDATE connections
			 SET name=?,host=?,port=?,user=?,password=?,key_path=?,kind=?,wsl_distro=?,env=?,group_name=?,updated_at=CURRENT_TIMESTAMP
			 WHERE id=?`,
			c.Name, c.Host, c.Port, c.User, c.Password, c.KeyPath, c.Kind, c.WSLDistro, c.Env, c.GroupName, c.ID,
		)
		if err != nil {
			return 0, err
		}
		return c.ID, nil
	}
	res, err := s.db.Exec(
		`INSERT INTO connections (name,host,port,user,password,key_path,kind,wsl_distro,env,group_name)
		 VALUES (?,?,?,?,?,?,?,?,?,?)`,
		c.Name, c.Host, c.Port, c.User, c.Password, c.KeyPath, c.Kind, c.WSLDistro, c.Env, c.GroupName,
	)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (s *Store) GetConnection(id int64) (Connection, error) {
	var c Connection
	row := s.db.QueryRow(
		`SELECT id,name,host,port,user,COALESCE(password,''),COALESCE(key_path,''),COALESCE(kind,'ssh'),COALESCE(wsl_distro,''),env,COALESCE(group_name,'')
		 FROM connections WHERE id=?`, id,
	)
	return c, row.Scan(&c.ID, &c.Name, &c.Host, &c.Port, &c.User, &c.Password, &c.KeyPath, &c.Kind, &c.WSLDistro, &c.Env, &c.GroupName)
}

func (s *Store) ListConnections() ([]Connection, error) {
	rows, err := s.db.Query(
		`SELECT id,name,host,port,user,COALESCE(password,''),COALESCE(key_path,''),COALESCE(kind,'ssh'),COALESCE(wsl_distro,''),env,COALESCE(group_name,'')
		 FROM connections ORDER BY group_name, name`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Connection
	for rows.Next() {
		var c Connection
		if err := rows.Scan(&c.ID, &c.Name, &c.Host, &c.Port, &c.User, &c.Password, &c.KeyPath, &c.Kind, &c.WSLDistro, &c.Env, &c.GroupName); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (s *Store) DeleteConnection(id int64) error {
	_, err := s.db.Exec(`DELETE FROM connections WHERE id=?`, id)
	return err
}

func (s *Store) DeleteDemoData() error {
	_, err := s.db.Exec(
		`DELETE FROM connections
		 WHERE name IN ('prod-web-01','prod-web-02','stg-web-01','dev-local')
		    OR (user='deploy' AND host IN ('10.0.1.10','10.0.1.11','10.0.2.10'))`,
	)
	if err != nil {
		return err
	}

	_, err = s.db.Exec(
		`DELETE FROM quick_commands
		 WHERE (label='tail logs' AND command='tail -f /var/log/app.log')
		    OR (label='disk usage' AND command='df -h')
		    OR (label='htop' AND command='htop')
		    OR (label='git status' AND command='git status')`,
	)
	return err
}

func (s *Store) ListQuickCommands() ([]QuickCommand, error) {
	rows, err := s.db.Query(
		`SELECT id,label,command,connection_id,sort_order FROM quick_commands ORDER BY sort_order`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []QuickCommand
	for rows.Next() {
		var q QuickCommand
		if err := rows.Scan(&q.ID, &q.Label, &q.Command, &q.ConnectionID, &q.SortOrder); err != nil {
			return nil, err
		}
		out = append(out, q)
	}
	return out, rows.Err()
}

func (s *Store) SaveQuickCommand(q QuickCommand) error {
	if q.ID > 0 {
		_, err := s.db.Exec(
			`UPDATE quick_commands SET label=?,command=?,connection_id=?,sort_order=? WHERE id=?`,
			q.Label, q.Command, q.ConnectionID, q.SortOrder, q.ID,
		)
		return err
	}
	_, err := s.db.Exec(
		`INSERT INTO quick_commands (label,command,connection_id,sort_order) VALUES (?,?,?,?)`,
		q.Label, q.Command, q.ConnectionID, q.SortOrder,
	)
	return err
}

func (s *Store) DeleteQuickCommand(id int64) error {
	_, err := s.db.Exec(`DELETE FROM quick_commands WHERE id=?`, id)
	return err
}

func (s *Store) ReassignQuickCommands(fromID int64, toID int64) error {
	_, err := s.db.Exec(
		`UPDATE quick_commands SET connection_id=? WHERE connection_id=?`,
		toID, fromID,
	)
	return err
}

func (s *Store) AttachOrphanQuickCommands(toID int64) error {
	_, err := s.db.Exec(
		`UPDATE quick_commands
		 SET connection_id=?
		 WHERE connection_id IS NOT NULL
		   AND connection_id NOT IN (SELECT id FROM connections)`,
		toID,
	)
	return err
}
