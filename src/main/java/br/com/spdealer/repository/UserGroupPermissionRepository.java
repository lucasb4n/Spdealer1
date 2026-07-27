package br.com.spdealer.repository;

import br.com.spdealer.model.UserGroupPermission;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserGroupPermissionRepository extends JpaRepository<UserGroupPermission, Long> {
    @Modifying
    @Transactional
    void deleteByGroupId(Long groupId);

    @org.springframework.data.jpa.repository.Query(
        "SELECT CASE WHEN COUNT(ugp) > 0 THEN true ELSE false END " +
        "FROM UserGroupPermission ugp " +
        "JOIN ugp.program p " +
        "WHERE ugp.group.id = :groupId AND p.codigo = :programCodigo AND ugp.permitido = true"
    )
    boolean existsByGroupIdAndProgramCodigo(@Param("groupId") Long groupId, @Param("programCodigo") String programCodigo);
    
    boolean existsByGroupIdAndProgramId(Long groupId, Long programId);
    
    java.util.List<UserGroupPermission> findByGroupId(Long groupId);
}
