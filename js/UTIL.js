function UTIL() {
    window.nivel = 1;

    this.getNivel = function () {
        return window.nivel;
    }

    this.addNivelInput = function() {
        var niveis = ['NULL','I', 'II', 'III', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
        window.nivel++;
        input = $('<div class="form-group mb-3"><div class="row"><div class="col"><label for="custoN'+window.nivel.toString()+'">Custo</label><input type="number" class="form-control" id="custoN'+window.nivel.toString()+'" placeholder="Digite o custo"></div><div class="col"><label for="turmaN'+window.nivel.toString()+'">Turma</label><input type="number" class="form-control" id="turmaN'+window.nivel.toString()+'" placeholder="Digite a turma"></div></div></div>');
        $("#niveisForm").append(input);
    }

}